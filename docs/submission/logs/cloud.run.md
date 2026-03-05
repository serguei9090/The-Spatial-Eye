DEFAULT 2026-03-05T17:45:09.607732Z google.genai.errors.APIError: 1011 None. Internal error occurred.
DEFAULT 2026-03-05T17:45:09.607747Z INFO: connection closed
DEFAULT 2026-03-05T17:45:09.609860Z Failed to proxy http://127.0.0.1:8000/ws/live?mode=spatial&token=[REDACTED_TOKEN] [Error: read ECONNRESET] {
DEFAULT 2026-03-05T17:45:09.609875Z errno: -104,
DEFAULT 2026-03-05T17:45:09.609881Z code: 'ECONNRESET',
DEFAULT 2026-03-05T17:45:09.609886Z syscall: 'read'
DEFAULT 2026-03-05T17:45:09.609891Z }
DEFAULT 2026-03-05T17:45:10.792825Z [httpRequest.requestMethod: GET] [httpRequest.status: 101] [httpRequest.responseSize: 334.69 KiB] [httpRequest.latency: 29.092 s] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/ws/live?mode=spatial&token=[REDACTED]
DEFAULT 2026-03-05T17:45:10.810399Z INFO: 104.28.153.55:0 - "WebSocket /ws/live?mode=spatial&token=[REDACTED]" [accepted]
DEFAULT 2026-03-05T17:45:10.812712Z 17:45:10 | INFO | main:websocket_endpoint - [e1c04664-44d9-43fd-accf-42018d221cc8] New Session - User: [REDACTED_USER_ID] - Mode: spatial
DEFAULT 2026-03-05T17:45:10.813351Z 17:45:10 | INFO | main:websocket_endpoint - [e1c04664-44d9-43fd-accf-42018d221cc8] Starting relay for mode: spatial
DEFAULT 2026-03-05T17:45:10.813860Z INFO: connection open
DEFAULT 2026-03-05T17:45:11.387064Z 17:45:11 | INFO | main:upstream_task - [e1c04664-44d9-43fd-accf-42018d221cc8] Upstream: Text -> please resume what you were doing exactly where yo
INFO 2026-03-05T17:45:30.196166Z [httpRequest.requestMethod: GET] [httpRequest.status: 304] [httpRequest.responseSize: 195 B] [httpRequest.latency: 4 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/worklets/pcm-capture-processor.js
DEFAULT 2026-03-05T17:45:39.886264Z An unexpected error occurred in live flow: 1011 None. Internal error occurred.
ERROR 2026-03-05T17:45:39.886306Z [severity: ERROR] Traceback (most recent call last): File "/app/backend/.venv/lib/python3.13/site-packages/google/genai/live.py", line 535, in _receive raw_response = await self._ws.recv(decode=False) ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ File "/app/backend/.venv/lib/python3.13/site-packages/websockets/asyncio/connection.py", line 322, in recv raise self.protocol.close_exc from self.recv_exc websockets.exceptions.ConnectionClosedError: received 1011 (internal error) Internal error occurred.; then sent 1011 (internal error) Internal error occurred.
DEFAULT 2026-03-05T17:45:39.886313Z During handling of the above exception, another exception occurred:
ERROR 2026-03-05T17:45:39.886324Z [severity: ERROR] Traceback (most recent call last): File "/app/backend/.venv/lib/python3.13/site-packages/google/adk/flows/llm_flows/base_llm_flow.py", line 199, in run_live async for event in agen:
DEFAULT 2026-03-05T17:45:39.886327Z ...<59 lines>...
DEFAULT 2026-03-05T17:45:39.886331Z return
DEFAULT 2026-03-05T17:45:39.886336Z File "/app/backend/.venv/lib/python3.13/site-packages/google/adk/flows/llm_flows/base_llm_flow.py", line 371, in _receive_from_model
DEFAULT 2026-03-05T17:45:39.886341Z async for llm_response in agen:
DEFAULT 2026-03-05T17:45:39.886348Z ...<42 lines>...
DEFAULT 2026-03-05T17:45:39.886352Z yield event
DEFAULT 2026-03-05T17:45:39.886356Z File "/app/backend/.venv/lib/python3.13/site-packages/google/adk/models/gemini_llm_connection.py", line 172, in receive
DEFAULT 2026-03-05T17:45:39.886361Z async for message in agen:
DEFAULT 2026-03-05T17:45:39.886366Z ...<128 lines>...
DEFAULT 2026-03-05T17:45:39.886370Z )
DEFAULT 2026-03-05T17:45:39.886373Z File "/app/backend/.venv/lib/python3.13/site-packages/google/genai/live.py", line 454, in receive
DEFAULT 2026-03-05T17:45:39.886377Z while result := await self._receive():
DEFAULT 2026-03-05T17:45:39.886381Z ^^^^^^^^^^^^^^^^^^^^^
DEFAULT 2026-03-05T17:45:39.886384Z File "/app/backend/.venv/lib/python3.13/site-packages/google/genai/live.py", line 545, in _receive
DEFAULT 2026-03-05T17:45:39.886397Z errors.APIError.raise_error(code, reason, None)
DEFAULT 2026-03-05T17:45:39.886400Z ~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^
DEFAULT 2026-03-05T17:45:39.886404Z File "/app/backend/.venv/lib/python3.13/site-packages/google/genai/errors.py", line 163, in raise_error
DEFAULT 2026-03-05T17:45:39.886407Z raise cls(status_code, response_json, response)
DEFAULT 2026-03-05T17:45:39.886601Z 17:45:39 | ERROR | main:downstream_task - [e1c04664-44d9-43fd-accf-42018d221cc8] Downstream Fatal Error: 1011 None. Internal error occurred.
DEFAULT 2026-03-05T17:45:39.887779Z 17:45:39 | INFO | main:websocket_endpoint - [e1c04664-44d9-43fd-accf-42018d221cc8] Relay Terminated & Cleaned Up.
DEFAULT 2026-03-05T17:45:39.895238Z google.genai.errors.APIError: 1011 None. Internal error occurred.
DEFAULT 2026-03-05T17:45:39.895252Z INFO: connection closed
DEFAULT 2026-03-05T17:45:41.070995Z [httpRequest.requestMethod: GET] [httpRequest.status: 101] [httpRequest.responseSize: 186.9 KiB] [httpRequest.latency: 57.384 s] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/ws/live?mode=spatial&token=[REDACTED]
DEFAULT 2026-03-05T17:45:41.086812Z INFO: 104.28.153.55:0 - "WebSocket /ws/live?mode=spatial&token=[REDACTED]" [accepted]
DEFAULT 2026-03-05T17:45:41.089114Z 17:45:41 | INFO | main:websocket_endpoint - [696b1449-865c-4095-99b7-7770753a9bf7] New Session - User: [REDACTED_USER_ID] - Mode: spatial
DEFAULT 2026-03-05T17:45:41.089666Z 17:45:41 | INFO | main:websocket_endpoint - [696b1449-865c-4095-99b7-7770753a9bf7] Starting relay for mode: spatial
DEFAULT 2026-03-05T17:45:41.090309Z INFO: connection open
DEFAULT 2026-03-05T17:45:41.659054Z 17:45:41 | INFO | main:upstream_task - [696b1449-865c-4095-99b7-7770753a9bf7] Upstream: Text -> please resume what you were doing exactly where yo
DEFAULT 2026-03-05T17:46:38.460534Z 17:46:38 | INFO | main:upstream_task - [696b1449-865c-4095-99b7-7770753a9bf7] Upstream: Disconnect message received.
DEFAULT 2026-03-05T17:46:38.460845Z INFO: connection closed
DEFAULT 2026-03-05T17:46:38.461737Z 17:46:38 | INFO | main:websocket_endpoint - [696b1449-865c-4095-99b7-7770753a9bf7] Relay Terminated & Cleaned Up.
NOTICE 2026-03-05T17:47:31.169674Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: UpdateService] [protoPayload.resourceName: us-central1:spatial-eye] [protoPayload.authenticationInfo.principalEmail: [REDACTED_EMAIL]] audit_log, method: "google.cloud.run.v2.Services.UpdateService", principal_email: "[REDACTED_EMAIL]"
INFO 2026-03-05T17:47:34.077518Z Starting new instance. Reason: DEPLOYMENT_ROLLOUT - Instance started due to traffic shifting between revisions due to deployment, traffic split adjustment, or deployment health check.
DEFAULT 2026-03-05T17:47:34.829949Z 🚀 Starting The Spatial Eye Unified Service...
DEFAULT 2026-03-05T17:47:34.831178Z 🐍 Starting Python Relay Backend on 0.0.0.0:8000...
DEFAULT 2026-03-05T17:47:34.838789Z ⚛️ Starting Next.js Frontend...
DEFAULT 2026-03-05T17:47:35.397286Z warning: Ignoring existing virtual environment linked to non-existent Python interpreter: .venv/bin/python3 -> python
DEFAULT 2026-03-05T17:47:35.960390Z Downloading cpython-3.13.12-linux-x86_64-gnu (download) (33.4MiB)
INFO 2026-03-05T17:47:35.962460Z Default STARTUP TCP probe succeeded after 1 attempt for container "spatial-eye-1" on port 3000.
DEFAULT 2026-03-05T17:47:35.969372Z ▲ Next.js 15.5.12
DEFAULT 2026-03-05T17:47:35.972033Z - Local: http://localhost:3000
DEFAULT 2026-03-05T17:47:35.972049Z - Network: http://0.0.0.0:3000
DEFAULT 2026-03-05T17:47:35.972637Z ✓ Starting...
DEFAULT 2026-03-05T17:47:36.565013Z ✓ Ready in 613ms
INFO 2026-03-05T17:47:37.133019Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: UpdateService] [protoPayload.resourceName: spatial-eye-00008-6t4] Ready condition status changed to True for Revision spatial-eye-00008-6t4 with message: Deploying revision succeeded in 5.73s.
DEFAULT 2026-03-05T17:47:38.385504Z Downloaded cpython-3.13.12-linux-x86_64-gnu (download)
DEFAULT 2026-03-05T17:47:38.732272Z Using CPython 3.13.12
INFO 2026-03-05T17:47:39.426486Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: UpdateService] [protoPayload.resourceName: spatial-eye] Ready condition status changed to True for Service spatial-eye.
INFO 2026-03-05T17:47:39.489868Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: UpdateService] [protoPayload.resourceName: spatial-eye-00008-6t4] Ready condition status changed to True for Revision spatial-eye-00008-6t4 with message: Deploying revision succeeded in 8.08s.
DEFAULT 2026-03-05T17:47:40.052352Z Removed virtual environment at: .venv
DEFAULT 2026-03-05T17:47:40.052369Z Creating virtual environment at: .venv
DEFAULT 2026-03-05T17:47:40.235775Z Downloading aiohttp (1.7MiB)
DEFAULT 2026-03-05T17:47:40.236167Z Downloading google-cloud-discoveryengine (3.2MiB)
DEFAULT 2026-03-05T17:47:40.236647Z Downloading google-cloud-aiplatform (7.8MiB)
DEFAULT 2026-03-05T17:47:40.237168Z Downloading ruff (10.6MiB)
DEFAULT 2026-03-05T17:47:40.237529Z Downloading google-api-python-client (14.0MiB)
DEFAULT 2026-03-05T17:47:40.239202Z Downloading cryptography (4.3MiB)
DEFAULT 2026-03-05T17:47:40.240454Z Downloading sqlalchemy (3.1MiB)
DEFAULT 2026-03-05T17:47:40.241055Z Downloading pyarrow (45.4MiB)
DEFAULT 2026-03-05T17:47:40.241586Z Downloading pydantic-core (2.0MiB)
DEFAULT 2026-03-05T17:47:40.242452Z Downloading grpcio (6.4MiB)
DEFAULT 2026-03-05T17:47:40.244198Z Downloading pillow (6.7MiB)
DEFAULT 2026-03-05T17:47:40.245202Z Downloading google-adk (2.5MiB)
INFO 2026-03-05T17:47:41.264262Z Shutting down user disabled instance
DEFAULT 2026-03-05T17:47:42.365844Z Downloaded pydantic-core
DEFAULT 2026-03-05T17:47:42.468086Z Downloaded aiohttp
DEFAULT 2026-03-05T17:47:42.996153Z Downloaded sqlalchemy
DEFAULT 2026-03-05T17:47:43.643282Z Downloaded cryptography
DEFAULT 2026-03-05T17:47:43.785876Z Downloaded pillow
DEFAULT 2026-03-05T17:47:43.812098Z Downloaded google-adk
DEFAULT 2026-03-05T17:47:43.834743Z Downloaded grpcio
DEFAULT 2026-03-05T17:47:44.018891Z Downloaded ruff
DEFAULT 2026-03-05T17:47:45.038404Z Downloaded google-cloud-discoveryengine
DEFAULT 2026-03-05T17:47:45.406659Z Downloaded google-api-python-client
DEFAULT 2026-03-05T17:47:45.745085Z Downloaded pyarrow
DEFAULT 2026-03-05T17:47:45.847242Z Downloaded google-cloud-aiplatform
DEFAULT 2026-03-05T17:47:46.546421Z Installed 128 packages in 698ms
DEFAULT 2026-03-05T17:47:54.504535Z 17:47:54 | SUCCESS | firebase_auth:initialize_firebase - Firebase Admin initialized for project: [REDACTED_PROJECT_ID]
DEFAULT 2026-03-05T17:47:54.665910Z INFO: Started server process [82]
DEFAULT 2026-03-05T17:47:54.666123Z INFO: Waiting for application startup.
DEFAULT 2026-03-05T17:47:54.666405Z INFO: Application startup complete.
DEFAULT 2026-03-05T17:47:54.666917Z INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
NOTICE 2026-03-05T18:08:01.011321Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: ReplaceService] [protoPayload.resourceName: spatial-eye] [protoPayload.authenticationInfo.principalEmail: github-actions-deployer@[REDACTED_PROJECT_ID].iam.gserviceaccount.com] audit_log, method: "google.cloud.run.v1.Services.ReplaceService", principal_email: "github-actions-deployer@[REDACTED_PROJECT_ID].iam.gserviceaccount.com"
INFO 2026-03-05T18:08:12.856356Z Starting new instance. Reason: DEPLOYMENT_ROLLOUT - Instance started due to traffic shifting between revisions due to deployment, traffic split adjustment, or deployment health check.
DEFAULT 2026-03-05T18:08:13.422090Z 🚀 Starting The Spatial Eye Unified Service Gateway...
DEFAULT 2026-03-05T18:08:13.429476Z 🕸️ Gateway listening on port 3000
DEFAULT 2026-03-05T18:08:13.429662Z 🐍 Starting Python Relay Backend on 127.0.0.1:8000...
INFO 2026-03-05T18:08:13.433401Z Default STARTUP TCP probe succeeded after 1 attempt for container "spatial-eye-1" on port 3000.
DEFAULT 2026-03-05T18:08:13.437112Z ⚛️ Starting Next.js Frontend on 127.0.0.1:3001...
INFO 2026-03-05T18:08:13.497389Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: ReplaceService] [protoPayload.resourceName: spatial-eye-00009-nrz] Ready condition status changed to True for Revision spatial-eye-00009-nrz with message: Deploying revision succeeded in 12.28s.
DEFAULT 2026-03-05T18:08:13.841140Z warning: Ignoring existing virtual environment linked to non-existent Python interpreter: .venv/bin/python3 -> python
DEFAULT 2026-03-05T18:08:14.281053Z ▲ Next.js 15.5.12
DEFAULT 2026-03-05T18:08:14.281580Z - Local: http://127.0.0.1:3001
DEFAULT 2026-03-05T18:08:14.281674Z - Network: http://127.0.0.1:3001
DEFAULT 2026-03-05T18:08:14.282001Z ✓ Starting...
DEFAULT 2026-03-05T18:08:14.325043Z Downloading cpython-3.13.12-linux-x86_64-gnu (download) (33.4MiB)
DEFAULT 2026-03-05T18:08:14.685996Z ✓ Ready in 414ms
INFO 2026-03-05T18:08:14.811112Z [protoPayload.serviceName: Cloud Run] [protoPayload.methodName: ReplaceService] [protoPayload.resourceName: spatial-eye] Ready condition status changed to True for Service spatial-eye.
DEFAULT 2026-03-05T18:08:16.202817Z Downloaded cpython-3.13.12-linux-x86_64-gnu (download)
DEFAULT 2026-03-05T18:08:16.560013Z Using CPython 3.13.12
DEFAULT 2026-03-05T18:08:17.689288Z Removed virtual environment at: .venv
DEFAULT 2026-03-05T18:08:17.689311Z Creating virtual environment at: .venv
DEFAULT 2026-03-05T18:08:17.868084Z Downloading cryptography (4.3MiB)
DEFAULT 2026-03-05T18:08:17.888134Z Downloading google-api-python-client (14.0MiB)
DEFAULT 2026-03-05T18:08:17.889450Z Downloading pydantic-core (2.0MiB)
DEFAULT 2026-03-05T18:08:17.891100Z Downloading aiohttp (1.7MiB)
DEFAULT 2026-03-05T18:08:17.892432Z Downloading google-adk (2.5MiB)
DEFAULT 2026-03-05T18:08:17.893435Z Downloading ruff (10.6MiB)
DEFAULT 2026-03-05T18:08:17.894053Z Downloading pillow (6.7MiB)
DEFAULT 2026-03-05T18:08:17.895094Z Downloading google-cloud-aiplatform (7.8MiB)
DEFAULT 2026-03-05T18:08:17.896091Z Downloading google-cloud-discoveryengine (3.2MiB)
DEFAULT 2026-03-05T18:08:17.896711Z Downloading sqlalchemy (3.1MiB)
DEFAULT 2026-03-05T18:08:17.897370Z Downloading grpcio (6.4MiB)
DEFAULT 2026-03-05T18:08:17.899013Z Downloading pyarrow (45.4MiB)
DEFAULT 2026-03-05T18:08:19.402377Z Downloaded pydantic-core
DEFAULT 2026-03-05T18:08:19.412720Z Downloaded aiohttp
DEFAULT 2026-03-05T18:08:19.727271Z Downloaded sqlalchemy
DEFAULT 2026-03-05T18:08:20.201977Z Downloaded cryptography
DEFAULT 2026-03-05T18:08:20.215088Z Downloaded google-adk
DEFAULT 2026-03-05T18:08:20.378032Z Downloaded pillow
DEFAULT 2026-03-05T18:08:20.398917Z Downloaded grpcio
DEFAULT 2026-03-05T18:08:20.526788Z Downloaded ruff
DEFAULT 2026-03-05T18:08:20.875177Z Downloaded google-cloud-discoveryengine
DEFAULT 2026-03-05T18:08:21.186051Z Downloaded google-api-python-client
DEFAULT 2026-03-05T18:08:21.718686Z Downloaded google-cloud-aiplatform
DEFAULT 2026-03-05T18:08:21.743310Z Downloaded pyarrow
DEFAULT 2026-03-05T18:08:22.389598Z Installed 128 packages in 645ms
DEFAULT 2026-03-05T18:08:30.661710Z 18:08:30 | SUCCESS | firebase_auth:initialize_firebase - Firebase Admin initialized for project: [REDACTED_PROJECT_ID]
DEFAULT 2026-03-05T18:08:30.812986Z INFO: Started server process [102]
DEFAULT 2026-03-05T18:08:30.813066Z INFO: Waiting for application startup.
DEFAULT 2026-03-05T18:08:30.813451Z INFO: Application startup complete.
DEFAULT 2026-03-05T18:08:30.813986Z INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO 2026-03-05T18:10:38.717985Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 8.59 KiB] [httpRequest.latency: 114 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/
INFO 2026-03-05T18:10:39.265326Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 4.72 KiB] [httpRequest.latency: 17 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/_next/static/chunks/200-504add8452853fd0.js
INFO 2026-03-05T18:10:39.276397Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 2.54 KiB] [httpRequest.latency: 12 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/_next/static/chunks/app/layout-abd16091e11b4338.js
INFO 2026-03-05T18:10:39.891661Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 2.21 KiB] [httpRequest.latency: 36 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/studio?_rsc=3lb4g
INFO 2026-03-05T18:10:40.029147Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 55.78 KiB] [httpRequest.latency: 22 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/_next/static/chunks/70-11d8ab71671c1c43.js
INFO 2026-03-05T18:10:40.038391Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 25.22 KiB] [httpRequest.latency: 15 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/_next/static/chunks/app/studio/page-509797f62d78a4ac.js
INFO 2026-03-05T18:10:41.684767Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 199 B] [httpRequest.latency: 55 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/api/status
INFO 2026-03-05T18:10:41.697358Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 904 B] [httpRequest.latency: 14 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/worklets/video-processor.worker.js
DEFAULT 2026-03-05T18:10:41.740464Z INFO: 104.28.153.55:0 - "GET /api/status HTTP/1.1" 200 OK
INFO 2026-03-05T18:10:44.382502Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 199 B] [httpRequest.latency: 6 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/api/status
DEFAULT 2026-03-05T18:10:44.392677Z INFO: 104.28.153.55:0 - "GET /api/status HTTP/1.1" 200 OK
DEFAULT 2026-03-05T18:10:44.581578Z [httpRequest.requestMethod: GET] [httpRequest.status: 101] [httpRequest.responseSize: 887.9 KiB] [httpRequest.latency: 46.086 s] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/ws/live?mode=spatial&token=[REDACTED]
DEFAULT 2026-03-05T18:10:44.596879Z INFO: 104.28.153.55:0 - "WebSocket /ws/live?mode=spatial&token=[REDACTED]" [accepted]
DEFAULT 2026-03-05T18:10:44.635640Z 18:10:44 | INFO | main:websocket_endpoint - [052406c5-eb54-479b-8a97-b2b586e53ee4] New Session - User: [REDACTED_USER_ID] - Mode: spatial
DEFAULT 2026-03-05T18:10:44.637472Z 18:10:44 | INFO | main:websocket_endpoint - [052406c5-eb54-479b-8a97-b2b586e53ee4] Starting relay for mode: spatial
DEFAULT 2026-03-05T18:10:44.639307Z INFO: connection open
INFO 2026-03-05T18:10:46.133393Z [httpRequest.requestMethod: GET] [httpRequest.status: 200] [httpRequest.responseSize: 894 B] [httpRequest.latency: 14 ms] [httpRequest.userAgent: OPR 127.0.0.0] https://spatial-eye-[REDACTED].us-central1.run.app/worklets/pcm-capture-processor.js
DEFAULT 2026-03-05T18:10:59.881290Z 18:10:59 | SUCCESS | main:downstream_task - [052406c5-eb54-479b-8a97-b2b586e53ee4] Tool Call Sent -> track_and_highlight({'label': 'headphone', 'box_2d': [230, 344, 690, 592], 'internal_context_check': "The white and grey headphones are resting on the user's head, which is centered in the frame."})
DEFAULT 2026-03-05T18:11:14.792737Z 18:11:14 | SUCCESS | main:downstream_task - [052406c5-eb54-479b-8a97-b2b586e53ee4] Tool Call Sent -> track_and_highlight({'label': 'bed', 'box_2d': [385, 595, 716, 1000], 'internal_context_check': 'The bed is in the background, filling the right portion of the frame with dark blue bedding and a bright green folded item near the foot.'})
DEFAULT 2026-03-05T18:11:26.506936Z 18:11:26 | SUCCESS | main:downstream_task - [052406c5-eb54-479b-8a97-b2b586e53ee4] Tool Call Sent -> track_and_highlight({'box_2d': [47, 152, 674, 258], 'label': 'blue dress', 'internal_context_check': 'The blue dress is hanging on the left side of the closet door, next to the light beige wall.'})
DEFAULT 2026-03-05T18:11:30.672770Z 18:11:30 | INFO | main:upstream_task - [052406c5-eb54-479b-8a97-b2b586e53ee4] Upstream: Disconnect message received.
DEFAULT 2026-03-05T18:11:30.673151Z INFO: connection closed
DEFAULT 2026-03-05T18:11:30.676105Z 18:11:30 | INFO | main:websocket_endpoint - [052406c5-eb54-479b-8a97-b2b586e53ee4] Relay Terminated & Cleaned Up.
