from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.contrib.postgres.search import SearchVector
from django.db.models import Q

from rest_framework import viewsets, filters, generics
from rest_framework.response import Response

import django_filters

import psycopg2
import json

from gallery.models import (
	Profile,
  Visualization,
  Collection
)

from gallery.serializers import (
  ProfileSerializer,
	ProfileDetailSerializer,
  VisualizationSerializer,
  CollectionSerializer
)


def index(request):
  return render(request, "gallery/index.html", { 'page': 'home' })

def collection(request, collectionId):
  return render(request, "gallery/collection.html", { 'page': 'collection' })

def collections(request):
  return render(request, "gallery/collections.html", { 'page': 'collections' })

def vis(request, visId):
  return render(request, "gallery/vis.html", { 'page': 'vis' })

def search(request):
  return render(request, "gallery/search.html", { 'page': 'search' })

def profile(request, profileId):
  return render(request, "gallery/profile.html", { 'page': 'profile' })



"""
API endpoints
"""

class ProfileViewSet(viewsets.ModelViewSet):
  queryset = Profile.objects.all()
  serializer_class = ProfileDetailSerializer

class VisualizationViewSet(viewsets.ModelViewSet):
  queryset = Visualization.objects.all()
  serializer_class = VisualizationSerializer

  def get_queryset(self):
    if(self.request.query_params.get('searchTerm')):
      query = Q( title__icontains = self.request.query_params.get('searchTerm') ) | Q( description__icontains = self.request.query_params.get('searchTerm') )
      return Visualization.objects.filter(query).exclude(screenshot__isnull=False)
    else:
      return Visualization.objects.all()

class CollectionViewSet(viewsets.ModelViewSet):
  queryset = Collection.objects.all()
  serializer_class = CollectionSerializer


"""
Special API endpoints (manual queries)
"""

def getCollectionDetails(request, collectionId):
  conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
  conn = psycopg2.connect(conn_string)
  cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)

  cursor.execute("""
    SELECT 
      v.*,
      p.id AS profile_id,
      p.full_name,
      p.name AS profile_name
    FROM
      visualization v
    JOIN
      profile p
    ON
      v.profile = p.name
    JOIN
      collection_visualization cv
    ON
      cv.vis_id = v.id
    WHERE
      cv.col_id = %s
    AND
      (v.screenshot IS NULL OR v.screenshot != False);
    """, [collectionId])

  resultData = []
  for row in cursor:
    resultData.append(dict(row))

  response = { 'results': resultData }
  
  return JsonResponse(response)


def getProfileDetails(request, profileId):
  conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
  conn = psycopg2.connect(conn_string)
  cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)

  cursor.execute("""
    SELECT 
      v.id,
      v.workbook,
      v.sheet,
      v.views,
      v.last_saved,
      v.description,
      v.title,
      v.s_chart_types,
      v.s_background_image,
      v.s_interactive_filter
    FROM
      visualization v
    JOIN
      profile p
    ON
      v.profile = p.name
    WHERE
      p.id = %s;
    """, [profileId])

  resultData = []
  for row in cursor:
    resultData.append(dict(row))
  response = { 'results': resultData }
  return JsonResponse(response)


"""
Vis labeling interface
"""

def labelManager(request):
  return render(request, "gallery/labelManager.html", { 'page': 'label-manager' })

def setVisLabels(request):
  visId = request.GET.get('id', 'false')
  chartTypes = request.GET.get('chartTypes', 'false')
  backgroundImage = request.GET.get('backgroundImage', 'false')
  interactiveFilter = request.GET.get('interactiveFilter', 'false')
  outstanding = request.GET.get('outstanding', 'false')

  conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
  conn = psycopg2.connect(conn_string)
  cursor = conn.cursor()

  cursor.execute('UPDATE visualization SET s_chart_types = %s, s_background_image = %s, s_interactive_filter = %s, s_outstanding = %s WHERE id = %s', [chartTypes, backgroundImage, interactiveFilter, outstanding, visId])
  
  conn.commit()
  cursor.close()
  conn.close()

  return HttpResponse("Saved vis labels")

def setMissingVisImage(request):
  visId = request.GET.get('id', 'false')

  conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
  conn = psycopg2.connect(conn_string)
  cursor = conn.cursor()

  cursor.execute('UPDATE visualization SET screenshot = False WHERE id = %s', [visId])
  
  conn.commit()
  cursor.close()
  conn.close()

  return HttpResponse("Saved missing image label")



def getRandomUnlabeledVis(request):
  conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
  conn = psycopg2.connect(conn_string)
  cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)

  cursor.execute("SELECT id from visualization WHERE s_chart_types IS NULL AND screenshot IS NULL ORDER BY random() LIMIT 1;")
  response = { 'id': cursor.fetchone()[0] }
  #response = requests.get('http://' + api_url + '/api/v0/floors/' + floorId + '/occupancy/' + deviceUrlSegment + byZoneUrlSegment,                             headers={'Authorization': 'Token ' + api_token })
  
  #responseJsonData = json.loads(response)
  print(response)
  return JsonResponse(response)


