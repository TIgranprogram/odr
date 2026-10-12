import mongoose
from models.Dictionary import Dictionary
from typing import List
from bson import ObjectId

class DictionaryService:
    @staticmethod
    async def getAll() -> List[any]:
        return await Dictionary.find({}).exec()

    @staticmethod
    async def getByCategory(category: str) -> List[any]:
        return await Dictionary.find({"category": category}).exec()

    @staticmethod
    async def createItem(name: str, category: str, value: str, meta: dict = None):
        new_item = Dictionary(
            name=name,
            category=category,
            value=value,
            meta=meta
        )
        return await new_item.save()

    @staticmethod
    async def updateItem(id: str, updates: dict):
        return await Dictionary.findById(id).update_one({"$set": updates})

    @staticmethod
    async def deleteItem(id: str):
        return await Dictionary.findById(id).delete_one()
