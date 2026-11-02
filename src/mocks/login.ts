/** 角色与网络选择登录的演示资料，仅用于临时登录页，不参与系统接口的权限判断。 */
import type { LoginUser } from '@/types/user.ts';

/** 网络默认办公网以兼容既有单参数调用；网络、平台角色与员工类型互不推导。 */
export function createDemoLoginUser(
  userType: LoginUser['userType'],
  netEnv: LoginUser['netEnv'] = '0',
): LoginUser {
  return {
    openId: 'F126138640EA144EF41F36B45C149B0F',
    ystId: '310798',
    employeeId: '80310798',
    netEnv,
    userType,
    userName: '谢伟业',
    department:
      '招商银行/总行/信息技术部/零售应用研发中心/信用卡开发团队/信用卡发卡外围开发室/账务一组',
    cmbUserType: '2',
  };
}
