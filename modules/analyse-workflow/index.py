from workers import WorkflowEntrypoint

from src.utils import logger


class AnalyseWorkflow(WorkflowEntrypoint):
    async def run(self, event, step):
        try:
            # Local dev (pywrangler/workerd) pre-converts the JS WorkflowEvent to a
            # Python dict. Production may still deliver a JsProxy. Handle both forms.
            if isinstance(event, dict):
                raw_payload = event.get("payload") or {}
                instance_id_raw = event.get("instanceId")
            else:
                raw_payload = event.payload
                instance_id_raw = event.instanceId

            # Convert JsProxy payload to a plain Python dict if needed.
            # `.to_py()` is a Pyodide JsProxy method unknown to the type stubs.
            if hasattr(raw_payload, "to_py"):
                payload = raw_payload.to_py()  # type: ignore[union-attr]
            elif isinstance(raw_payload, dict):
                payload = raw_payload
            else:
                payload = {}

            # Explicitly convert to Python str so no JsProxy leaks into the step
            # closure or step result — a JsProxy in the result causes the Workflows
            # serialiser to hang silently.
            instance_id = str(instance_id_raw) if instance_id_raw is not None else ""
            case_id = str(payload["caseId"]) if payload.get("caseId") is not None else None
            image_key = str(payload["imageKey"]) if payload.get("imageKey") is not None else None
            _uploaded_at = payload.get("uploadedAt")
            _actor_id = payload.get("actorId")

            logger.info("workflow started", instanceId=instance_id, caseId=case_id)

            @step.do("analyse")
            async def analyse():
                # TODO: run analysis against image_key from R2
                return {"instanceId": instance_id, "caseId": case_id, "imageKey": image_key}

            await analyse()
            logger.info("workflow complete", instanceId=instance_id, caseId=case_id)
        except Exception as e:
            logger.error("workflow run failed", error=str(e))
            raise
