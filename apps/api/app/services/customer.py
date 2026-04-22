import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AppError
from app.models.customer import Customer, Gender
from app.models.customer_contact import ContactType, CustomerContact
from app.schemas.customer import (
    CustomerContactCreate,
    CustomerCreate,
    CustomerSearchParams,
    CustomerUpdate,
)


async def _next_customer_code(db: AsyncSession) -> str:
    result = await db.execute(
        select(func.max(Customer.code)).where(Customer.code.like("KH-%"))
    )
    last_code = result.scalar_one_or_none()
    if last_code:
        seq = int(last_code.replace("KH-", "")) + 1
    else:
        seq = 1
    return f"KH-{seq:06d}"


def _build_contact(data: CustomerContactCreate, customer_id: uuid.UUID) -> CustomerContact:
    return CustomerContact(
        customer_id=customer_id,
        contact_type=ContactType(data.contact_type),
        value=data.value,
        label=data.label,
        is_primary=data.is_primary,
        notes=data.notes,
    )


async def create_customer(db: AsyncSession, data: CustomerCreate) -> Customer:
    if data.phone:
        existing = await db.execute(
            select(Customer.id).where(Customer.phone == data.phone)
        )
        if existing.scalar_one_or_none():
            raise AppError(409, "Phone number already exists")

    code = await _next_customer_code(db)
    customer = Customer(
        code=code,
        full_name=data.full_name,
        phone=data.phone,
        dob=data.dob,
        gender=Gender(data.gender) if data.gender else None,
        address=data.address,
        notes=data.notes,
        branch_id=data.branch_id,
    )
    db.add(customer)
    await db.flush()

    for contact_data in data.contacts:
        db.add(_build_contact(contact_data, customer.id))

    await db.commit()
    await db.refresh(customer)
    return customer


async def get_customer(db: AsyncSession, customer_id: uuid.UUID) -> Customer:
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise AppError(404, "Customer not found")
    return customer


async def update_customer(
    db: AsyncSession, customer_id: uuid.UUID, data: CustomerUpdate
) -> Customer:
    customer = await get_customer(db, customer_id)
    update_data = data.model_dump(exclude_unset=True)

    if "phone" in update_data and update_data["phone"]:
        existing = await db.execute(
            select(Customer.id).where(
                Customer.phone == update_data["phone"],
                Customer.id != customer_id,
            )
        )
        if existing.scalar_one_or_none():
            raise AppError(409, "Phone number already exists")

    if "gender" in update_data:
        update_data["gender"] = Gender(update_data["gender"]) if update_data["gender"] else None

    for field, value in update_data.items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)
    return customer


async def delete_customer(db: AsyncSession, customer_id: uuid.UUID) -> None:
    customer = await get_customer(db, customer_id)
    await db.delete(customer)
    await db.commit()


async def search_customers(
    db: AsyncSession, params: CustomerSearchParams
) -> tuple[list[Customer], int]:
    query = select(Customer)
    count_query = select(func.count()).select_from(Customer)

    if params.q:
        term = params.q.strip()
        like_term = f"{term}%"
        filter_clause = or_(
            Customer.phone == term,
            Customer.code.ilike(like_term),
            Customer.full_name.ilike(f"%{term}%"),
        )
        query = query.where(filter_clause)
        count_query = count_query.where(filter_clause)

    if params.gender:
        query = query.where(Customer.gender == Gender(params.gender))
        count_query = count_query.where(Customer.gender == Gender(params.gender))

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (params.page - 1) * params.per_page
    query = query.order_by(Customer.created_at.desc()).offset(offset).limit(params.per_page)
    result = await db.execute(query)
    customers = list(result.scalars().all())

    return customers, total


async def add_contact(
    db: AsyncSession, customer_id: uuid.UUID, data: CustomerContactCreate
) -> CustomerContact:
    await get_customer(db, customer_id)
    contact = _build_contact(data, customer_id)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_contact(db: AsyncSession, contact_id: uuid.UUID) -> None:
    result = await db.execute(
        select(CustomerContact).where(CustomerContact.id == contact_id)
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise AppError(404, "Contact not found")
    await db.delete(contact)
    await db.commit()
