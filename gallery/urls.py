
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import url, include
from django.views.generic import RedirectView
from rest_framework import routers
from . import views

router = routers.DefaultRouter()


"""
Regions
"""

router.register(r'visualization', views.VisualizationViewSet)
router.register(r'profile', views.ProfileViewSet)
router.register(r'collection', views.CollectionViewSet)

urlpatterns = [
  url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
  url(r'^$', views.collections, name='collections'),
  url(r'^collection/$', views.collections, name='collections'),
  url(r'^collection/(?P<collectionId>[0-9]+)/$', views.collection, name='collection'),
  url(r'^profile/(?P<profileId>[0-9]+)/$', views.profile, name='profile'),
  url(r'^special-api/collection/(?P<collectionId>[0-9]+)/$', views.getCollectionDetails, name='get-collection-details'),
  url(r'^vis/(?P<visId>[0-9]+)/$', views.vis, name='vis'),
  url(r'^search/$', views.search, name='search'),
  url(r'^special-api/profile/(?P<profileId>[0-9]+)/$', views.getProfileDetails, name='get-profile-details'),
  url(r'^api/', include(router.urls)),
  url(r'^supervised/label-manager', views.labelManager, name='label-manager'),
  url(r'^supervised/get-unlabeled-vis', views.getRandomUnlabeledVis, name='get-random-unlabeled-vis'),
  url(r'^supervised/set-vis-labels', views.setVisLabels, name='set-vis-labels'),
  url(r'^supervised/set-missing-image', views.setMissingVisImage, name='set-missing-image'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)