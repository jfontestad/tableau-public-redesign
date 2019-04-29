# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from __future__ import unicode_literals

from django.contrib.postgres.fields import JSONField
from django.db import models


class Profile(models.Model):
    name = models.CharField(max_length=130, blank=True, null=True, unique=True)
    vizzes = models.IntegerField(blank=True, null=True)
    followers = models.IntegerField(blank=True, null=True)
    following = models.IntegerField(blank=True, null=True)
    full_name = models.TextField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    organization = models.TextField(blank=True, null=True)
    website = models.TextField(blank=True, null=True)
    facebook = models.TextField(blank=True, null=True)
    twitter = models.TextField(blank=True, null=True)
    linkedin = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'profile'


class Visualization(models.Model):
    workbook = models.TextField(blank=True, null=True)
    sheet = models.TextField(blank=True, null=True)
    #profile = models.TextField(blank=True, null=True)
    profile_data = models.ForeignKey(Profile, related_name='profile_name', db_column='profile', to_field='name')
    views = models.IntegerField(blank=True, null=True)
    score = models.IntegerField(blank=True, null=True)
    originally_published = models.TextField(blank=True, null=True)
    last_saved = models.DateTimeField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    caption = models.TextField(blank=True, null=True)
    title = models.TextField(blank=True, null=True)
    screenshot = models.NullBooleanField()
    s_chart_types = models.TextField(blank=True, null=True)
    s_background_image = models.NullBooleanField()
    s_interactive_filter = models.NullBooleanField()
    tweets = models.IntegerField(blank=True, null=True)
    sheets = JSONField()

    class Meta:
        managed = False
        db_table = 'visualization'


class VisualizationDetail(models.Model):
    workbook = models.TextField(blank=True, null=True)
    sheet = models.TextField(blank=True, null=True)
    vizql = JSONField()

    class Meta:
        managed = False
        db_table = 'visualization_detail'


class Collection(models.Model):
    title = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    collection_group = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'collection'

