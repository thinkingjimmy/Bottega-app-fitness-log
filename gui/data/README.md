# data/

> L2 | Parent: [README.md](../README.md)

- `exercises.json`: 72 canonical exercises with names, aliases, instructions, deduplicated muscle weights, and licensed media attribution.
- `muscle-regions.json`: The 17 canonical zone IDs and labels in zh-CN/en/ja/fr/es.
- `terms.json`: Complete five-language body-part, equipment, and muscle vocabulary.
- `body-map.json`: Male and female front/back outline, decoration, and semantic zone geometry.
- `source.json`: Pinned exercise upstream revision, generator version, hashes, and media evidence.
- `body-map.source.json`: Pinned anatomy upstream revision, generator version, asset hashes, and locale coverage.
- `exercises-dataset.LICENSE.txt`: Original exercise dataset MIT license with its media exception.
- `gym-visual.NOTICE.md`: Original animation license terms, attribution, and 180×180 limit.
- `body-highlighter.LICENSE.txt`: Original anatomical geometry MIT license.

Exercise source: `hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd`. Anatomy source: `HichamELBSI/react-native-body-highlighter@15df9e2dbc621450001960bed5a30e6a75357faa`.

The React resource module imports these JSON files statically. Geometry, region labels, and exercise zone references must have identical coverage. Vocabulary keys must match the catalog in every locale. Provenance tests verify hashes and licensed animation dimensions; source data and license bytes are preserved during GUI migrations.

[PROTOCOL]: Update this header when the file changes, then check README.md
