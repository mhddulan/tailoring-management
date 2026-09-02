from django.urls import path

from . import views


urlpatterns = [

    # ==================================================
    # ALTERATION
    # ==================================================

    path(
        "",
        views.alteration_list,
        name="alteration_list"
    ),

    path(
        "add/",
        views.alteration_create,
        name="alteration_create"
    ),

    path(
        "<int:id>/",
        views.alteration_detail,
        name="alteration_detail"
    ),

    path(
        "<int:id>/edit/",
        views.alteration_edit,
        name="alteration_edit"
    ),

    path(
        "<int:id>/delete/",
        views.alteration_delete,
        name="alteration_delete"
    ),

    path(
        "<int:id>/print/",
        views.alteration_print,
        name="alteration_print"
    ),
]