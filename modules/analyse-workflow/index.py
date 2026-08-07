from workers import WorkflowEntrypoint

from src.utils import logger


class AnalyseWorkflow(WorkflowEntrypoint):
    async def run(self, event, step):
        try:
            payload = event.get("payload", {})
            # Convert JsProxy to Python dict if the params arrived as a JS object
            if hasattr(payload, "to_py"):
                payload = payload.to_py()
            instance_id = event.get("instanceId")
            case_id = payload.get("caseId")
            image_key = payload.get("imageKey")
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
