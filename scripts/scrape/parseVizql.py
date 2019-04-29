import psycopg2
import psycopg2.extras
import sys
import json


def keys_exist(element, *keys):
  """
  Helper function: check if *keys (nested) exist in `element` (dict).
  """
  if type(element) is not dict:
      raise AttributeError('keys_exists() expects dict as first argument.')
  if len(keys) == 0:
      raise AttributeError('keys_exists() expects at least two arguments, one given.')

  _element = element
  for key in keys:
      try:
          _element = _element[key]
      except KeyError:
          return False
  return True

conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
conn = psycopg2.connect(conn_string)
cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)
cursor2 = conn.cursor()

cursor.execute("""\
  SELECT
    *
  FROM
    visualization
  WHERE
    vizql IS NOT NULL
  """)

for row in cursor:
  vizId = row["id"]
  vizql = row["vizql"]
  locale = vizql["data"]["workbookLocale"]

  print("ID: " + str(vizId))
  workbookPresModel = vizql["data"]["worldUpdate"]["applicationPresModel"]["workbookPresModel"]
  sheetsInfo = workbookPresModel["sheetsInfo"]

  zones = dict()
  noZones = False
  try:
    zones = workbookPresModel["dashboardPresModel"]["zones"]
  except (KeyError, TypeError):
    noZones = True
    pass

  # Iterate over sheets and dashboards
  nSheets = 0
  nDashboards = 0
  for sheet in sheetsInfo:
    if sheet["isVisible"] and sheet["isPublished"]:
      nSheets += 1
      if sheet["isDashboard"]:
        nDashboards += 1

  # Iterate over zones and search for possible map objects, background images
  mapServer = False
  backgroundImage = False
  imageDictionaries = 0
  for key, zone in zones.items():
    try:
      if zone["presModelHolder"]["visual"]["imageDictionary"]:
        imageDictionaries += 1
    except (KeyError, TypeError):
      pass

    try:
      if zone["presModelHolder"]["visual"]["hasBackgroundImage"]:
        backgroundImage = True
    except (KeyError, TypeError):
      pass

    try:
      if zone["presModelHolder"]["visual"]["isMap"]:
        mapServer = True
    except (KeyError, TypeError):
      pass
    
  # Check if device designer has been used
  if workbookPresModel["dashboardPresModel"]["dashboardDeviceLayouts"]:
    deviceLayouts = '; '.join(workbookPresModel["dashboardPresModel"]["dashboardDeviceLayouts"])
  else:
    deviceLayouts = None

  try:
    downloadLink = workbookPresModel["dashboardPresModel"]["sheetLayoutInfo"]["downloadLink"]
  except (KeyError, TypeError):
    downloadLink = ""
    pass

  downloadLinkExists = False
  if len(downloadLink) > 0:
    downloadLinkExists = True

  cursor2.execute("""\
      UPDATE
        visualization
      SET 
        e_locale = %s,
        e_sheets = %s,
        e_dashboards = %s,
        e_device_layouts = %s,
        e_map_server = %s,
        e_background_image = %s,
        e_image_dictionaries = %s,
        e_no_zones = %s,
        e_downloadable = %s
      WHERE
        id = %s
    """, [locale, 
          nSheets,
          nDashboards,
          deviceLayouts,
          mapServer,
          backgroundImage,
          imageDictionaries,
          noZones,
          downloadLinkExists,
          vizId])


cursor.close()
cursor2.close()
conn.commit()
conn.close()