

type CaseIdGeneratorOptions = {
  type?: string;
};

export const caseIdGenerator = ({ type = "cnc" }: CaseIdGeneratorOptions = {}): string => {
  const now = new Date();

  now.toDateString();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = crypto.randomUUID().slice(0, 8);

  return `${type}-${year}${month}${day}-${randomSuffix}`;
};