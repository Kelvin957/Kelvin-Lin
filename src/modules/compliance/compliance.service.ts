export type ComplianceCheckResult = {
  pass: boolean;
  code: string;
  message: string;
};

export function checkPiplConsent(consentAccepted: boolean): ComplianceCheckResult {
  if (!consentAccepted) {
    return {
      pass: false,
      code: "PIPL_CONSENT_REQUIRED",
      message: "根据《个人信息保护法》，请先同意相关协议后再继续操作。"
    };
  }

  return {
    pass: true,
    code: "OK",
    message: "合规检查通过"
  };
}

export function buildDataRetentionPolicy(days: number): string {
  return `日志与审计数据默认保留 ${days} 天，超过保留期后执行自动脱敏或删除。`;
}
