from rest_framework.pagination import PageNumberPagination as OriginalPageNumberPagination


class PageNumberPagination(OriginalPageNumberPagination):
    page_size_query_param = "count"
    max_page_size = 500
