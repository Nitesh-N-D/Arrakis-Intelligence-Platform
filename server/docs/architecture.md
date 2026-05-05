# Architecture

```text
                +---------------------------+
                |   React + Tailwind UI     |
                | Prescience / Storm Views  |
                +-------------+-------------+
                              |
                        HTTPS / Socket.io
                              |
              +---------------+----------------+
              |        Express API Layer       |
              | Controllers + Middleware       |
              +---------------+----------------+
                              |
         +--------------------+----------------------+
         |                    |                      |
  +------+-------+    +-------+-------+      +-------+-------+
  | Auth Service |    | Dune Engines  |      | Analytics /   |
  | JWT / OAuth  |    | Spice/Storm/  |      | Prescience    |
  +------+-------+    | Rank / Skills |      +-------+-------+
         |            +-------+-------+              |
         +--------------------+----------------------+
                              |
                      Repositories Layer
                              |
                      MongoDB + Mongoose
```
