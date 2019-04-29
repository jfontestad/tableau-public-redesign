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
    v.id,
    v.e_downloadable,
    v.last_saved,
    v.title,
    v.description,
    v.views,
    p.followers,
    p.vizzes
  FROM
    visualization v
  JOIN
    profile p
  ON
    v.profile = p.name
  WHERE 
    v.vizql IS NOT NULL AND 
    v.e_no_zones = FALSE
  """)

def clamp(n, minn, maxn):
  return max(min(maxn, n), minn)

for row in cursor:
  vizId = row["id"]

  score = 0

  if row["e_downloadable"]:
    score += 10

  if row["title"] and len(row["title"]) >= 5:
    score += 20

  if row["description"] and row["description"] != row["title"] and len(row["description"]) >= 50:
    score += 15

  # 0.5% per published vis
  if row["vizzes"] is None:
    row["vizzes"] = 0
  score += clamp(row["vizzes"] * 0.5, 0, 15)

  # 0.5% per follower
  if row["followers"] is None:
    row["followers"] = 0
  score += clamp(row["followers"] * 0.5, 0, 15)

  # 1% per 50 visits
  score += clamp(row["views"] * 0.02, 0, 20)

  # Reduce 1% every 73 days (max. 5%)
  delta = datetime.datetime.strptime("2017-06-12 00:00:00", "%Y-%m-%d %H:%M:%S") - row["last_saved"]
  daysDifference = delta.days
  if daysDifference <= 365:
    dateScoreComponent = 5
    dateScoreComponent -= int(round(daysDifference/73)) 
    score += dateScoreComponent

  cursor2.execute("""\
      UPDATE
        visualization
      SET 
        score = %s
      WHERE
        id = %s
    """, [score,
          vizId])

cursor.close()
cursor2.close()
conn.commit()
conn.close()