from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str | None

    model_config = {"from_attributes": True}
