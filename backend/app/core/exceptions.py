from fastapi import HTTPException, status

class SahayikaException(HTTPException):
    def __init__(self, status_code: int, message: str, details: dict = None):
        super().__init__(status_code=status_code, detail={"message": message, "details": details or {}})

class NotFoundException(SahayikaException):
    def __init__(self, resource: str, resource_id: str = ""):
        message = f"{resource} not found" if not resource_id else f"{resource} '{resource_id}' not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, message=message)

class UnauthorizedException(SahayikaException):
    def __init__(self, message: str = "Invalid credentials or unauthorized access"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message)

class ForbiddenException(SahayikaException):
    def __init__(self, message: str = "You do not have permission to access this resource"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message)

class ValidationException(SahayikaException):
    def __init__(self, message: str, errors: dict = None):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, message=message, details=errors)

class ConflictException(SahayikaException):
    def __init__(self, message: str = "A resource with these details already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, message=message)


