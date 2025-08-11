from django.urls import include, path
from django.contrib import admin


urlpatterns = [
    path("api/forms/", include("forms.urls")),
    path('admin/', admin.site.urls),
]

admin.site.site_header = 'All About Berlin admin'
