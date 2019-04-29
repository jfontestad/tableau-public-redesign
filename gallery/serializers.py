from rest_framework import serializers
from gallery.models import (
    Profile,
    Visualization,
    Collection
)

from drf_queryfields import QueryFieldsMixin

"""
Regions (spatial metadata)
"""

class ProfileDetailSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'followers', 'following', 'full_name', 'location', 'name', 'organization', 'url', 'vizzes', 'website', 'facebook', 'twitter', 'linkedin', 'bio')

class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'followers', 'following', 'full_name', 'location', 'name', 'organization', 'url', 'vizzes', 'website')

class VisualizationSerializer(QueryFieldsMixin, serializers.HyperlinkedModelSerializer):
    profile_data = ProfileSerializer()

    class Meta:
        model = Visualization
        fields = ('id', 'workbook', 'sheet', 'title', 'description', 'caption', 'last_saved', 'originally_published', 'views', 'score', 's_chart_types', 's_background_image', 's_interactive_filter', 'profile_data', 'screenshot')

class CollectionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Collection
        fields = ('id', 'title', 'description', 'collection_group')