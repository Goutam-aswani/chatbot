
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# 1. Create a Limiter instance
#    The `key_func` tells the limiter how to identify a client.
#    Here, we use the client's IP address.
limiter = Limiter(key_func=get_remote_address)

