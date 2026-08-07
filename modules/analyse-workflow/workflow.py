from workers import WorkflowEntrypoint


class AnalyseWorkflow(WorkflowEntrypoint):
    async def run(self, event, step):
        payload = event.get("payload", {})
        case_id = payload.get("caseId")
        image_key = payload.get("imageKey")
        uploaded_at = payload.get("uploadedAt")
        actor_id = payload.get("actorId")

        @step.do("analyse")
        async def analyse():
            # TODO: run analysis against image_key from R2
            return {"status": "ok", "caseId": case_id, "imageKey": image_key}

        result = await analyse()
        return result
