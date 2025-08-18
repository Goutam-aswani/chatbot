from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    secret_key: str
    database_url : str
    algorithm: str
    access_token_expire_minutes: int
    google_api_key: str
    mail_username: str
    mail_password: str
    mail_from: str
    mail_port: int
    mail_server: str
    mail_starttls: bool
    mail_ssl_tls: bool
    model_config = SettingsConfigDict(env_file = ".env")

settings = Settings()