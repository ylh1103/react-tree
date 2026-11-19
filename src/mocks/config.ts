/** Mock 仅配置延迟、清单规模和接口错误，不构造登录身份或员工资料。 */
export const mockConfig: {
  systemAccessError: 403 | 503 | null;
  delayMs: number;
  applicationCount: number;
} = {
  systemAccessError: null,
  delayMs: 500,
  applicationCount: 785,
};
