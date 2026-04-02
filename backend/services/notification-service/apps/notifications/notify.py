import logging, requests as _req

logger   = logging.getLogger(__name__)
NOTIF    = 'http://notification-service:8006'
INTERNAL = {'X-Service-Token': 'internal-service-secret'}

def _post(path, data):
    try:
        _req.post(f'{NOTIF}/api/notifications/{path}', json=data, headers=INTERNAL, timeout=4)
    except Exception as e:
        logger.warning(f'Notification skipped ({path}): {e}')