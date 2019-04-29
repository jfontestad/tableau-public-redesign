
# Select all vizzes (tweets with makeovermonday hashtag)
select v.id, v.workbook, t.hashtags, 1 AS collection FROM visualization v JOIN tweet t ON v.workbook = t.workbook WHERE LOWER(hashtags) LIKE '%makeovermonday%'

# ... and the corresponding 'collection' insert statement (m:n table)
INSERT INTO collection_visualization (col_id, vis_id) SELECT 1 AS col_id, v.id AS vis_id FROM visualization v JOIN tweet t ON v.workbook = t.workbook WHERE LOWER(hashtags) LIKE '%makeovermonday%';

########################################################################

# select all vizzes that were posted on Twitter
SELECT 2 AS col_id, v.id, v.tweet FROM visualization v WHERE v.tweet = True

# ... and the corresponding 'collection' insert statement (m:n table)
INSERT INTO collection_visualization (col_id, vis_id) SELECT 2 AS col_id, v.id, v.tweet FROM visualization v WHERE v.tweet = True;

########################################################################

# select all vizzes of a certain chart type

SELECT 13 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%areachart%';

INSERT INTO collection_visualization (col_id, vis_id) SELECT 13 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%areachart%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# linechart
INSERT INTO collection_visualization (col_id, vis_id) SELECT 12 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%linechart%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# barchart or columnchart
INSERT INTO collection_visualization (col_id, vis_id) SELECT 12 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%barchart%' OR s_chart_types LIKE '%columnchart%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# piechart
INSERT INTO collection_visualization (col_id, vis_id) SELECT 14 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%piechart%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# map
INSERT INTO collection_visualization (col_id, vis_id) SELECT 16 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%map%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# treemap
INSERT INTO collection_visualization (col_id, vis_id) SELECT 18 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%treemap%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# table
INSERT INTO collection_visualization (col_id, vis_id) SELECT 17 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%table%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# scatterplot
INSERT INTO collection_visualization (col_id, vis_id) SELECT 15 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%scatterplot%' ON CONFLICT (col_id, vis_id) DO NOTHING;

# bubblechart
INSERT INTO collection_visualization (col_id, vis_id) SELECT 19 AS col_id, v.id FROM visualization v WHERE s_chart_types LIKE '%bubblechart%' ON CONFLICT (col_id, vis_id) DO NOTHING;
