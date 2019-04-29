import psycopg2
import psycopg2.extras
import sys
import json

import datetime


conn_string = "host='localhost' dbname='tableau_public' user='tableau' password='tp'"
conn = psycopg2.connect(conn_string)
cursor = conn.cursor('cursor_unique_name', cursor_factory=psycopg2.extras.DictCursor)
cursor2 = conn.cursor()

cursor.execute("""\
  SELECT
    vd.workbook, vd.sheet, vd.vizql
  FROM
    visualization_detail vd
  JOIN
    visualization v
  ON
    vd.workbook = v.workbook AND vd.sheet = v.sheet
  WHERE
    v.vizql IS NULL
  """)

for row in cursor:
  vizql = row["vizql"]
  workbook = row["workbook"]
  sheet = row["sheet"]

  cursor2.execute("""\
      UPDATE
        visualization
      SET 
        vizql = %s
      WHERE
        workbook = %s AND sheet = %s AND vizql IS NULL
    """, [vizql,workbook,sheet])

cursor.close()
cursor2.close()
conn.commit()
conn.close()