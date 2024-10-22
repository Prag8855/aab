from django.http import JsonResponse
from django.views import View


class TestView(View):
    def get(self, request, *args, **kwargs):
        data = {
            'message': 'Hello, World!',
            'status': 'success',
            'data': {
                'id': 1,
                'name': 'Example Item',
            }
        }
        return JsonResponse(data)
