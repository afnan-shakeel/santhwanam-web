# create three pages. a forum page, area page and unit page. each page should have a list view similar to the users and roles page. 

- below is the open api snippet for forum search api
```
    "/api/organization-bodies/forums/search": {
      "post": {
        "tags": ["Organization Bodies - Forums"],
        "summary": "Search forums with advanced filtering",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SearchRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SearchResponse"
                }
              }
            }
          }
        }
      }
    },

```


- below is the open api snippet for area search api
```
    "/api/organization-bodies/areas/search": {
      "post": {
        "tags": ["Organization Bodies - Areas"],
        "summary": "Search areas with advanced filtering",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SearchRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SearchResponse"
                }
              }
            }
          }
        }
      }
    },

```

- below is the open api snippet for unit search api
```
    "/api/organization-bodies/units/search": {
      "post": {
        "tags": ["Organization Bodies - Units"],
        "summary": "Search units with advanced filtering",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SearchRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SearchResponse"
                }
              }
            }
          }
        }
      }
    },
```