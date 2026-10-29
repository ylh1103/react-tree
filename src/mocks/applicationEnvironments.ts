/** 环境参数演示数据故意乱序，覆盖生产、审批、空配置与负数差异状态。 */
import type { ApplicationEnvironment } from '@/types/applicationEnvironments.ts';

/** 覆盖常见服务配置及 YAML 数据类型，供主题高亮、折叠、格式化和环境差异演示；地址与凭据均为示例。 */
function createExampleYaml(systemName: string, appName: string, envTag: string) {
  const production = envTag === 'prd';
  // 动态名称按 JSON 字符串转义，避免冒号、引号或换行破坏 YAML 文档结构。
  return `# 参数配置演示：支持中文、嵌套结构及常见 YAML 语法
# 此文档仅用于编辑器预览，不代表真实服务或连接信息。
spring:
  application:
    name: ${JSON.stringify(appName)}
  profiles:
    active: ${JSON.stringify(envTag)}
  datasource:
    url: "jdbc:postgresql://db.example.test:5432/demo"
    username: demo_user
    password: "DEMO_PASSWORD"
    hikari:
      minimum-idle: 2
      maximum-pool-size: ${production ? 30 : 10}
      connection-timeout: 30000
  data:
    redis:
      host: cache.example.test
      port: 6379
      database: 0
      timeout: 2s
  kafka:
    bootstrap-servers:
      - broker-1.example.test:9092
      - broker-2.example.test:9092
    consumer:
      group-id: demo-consumers
      auto-offset-reset: earliest
      enable-auto-commit: false

server:
  port: ${production ? 8080 : 8081}
  shutdown: graceful
  servlet:
    context-path: /api
  compression:
    enabled: true
    mime-types: [application/json, text/plain, text/html]

application:
  system: ${JSON.stringify(systemName)}
  title: "参数管理演示"
  version: "1.0.0"
  homepage: https://app.example.test
  release-date: 2026-10-30
  features:
    audit: true
    debug: ${!production}
    experimental: false
  cors:
    allowed-origins:
      - https://console.example.test
      - http://localhost:5173
    allowed-methods: [GET, POST, PUT, DELETE]
  limits:
    request-per-second: 100
    burst-ratio: 1.5
    retry-delays: [100, 500, 1000]
  routes:
    - id: users
      path: /users/**
      target: https://users.example.test
      enabled: true
    - id: reports
      path: /reports/**
      target: https://reports.example.test
      enabled: false

logging:
  level:
    root: ${production ? 'WARN' : 'DEBUG'}
    org.springframework: INFO
  file:
    name: ./logs/application.log
  pattern:
    console: '%d{HH:mm:ss.SSS} %-5level [%thread] %logger - %msg%n'

management:
  endpoints:
    web:
      exposure:
        include: [health, info, prometheus]
  endpoint:
    health:
      show-details: when_authorized
  tracing:
    sampling:
      probability: 0.1

# 锚点与别名：两个任务复用同一组请求配置，不使用自定义标签。
http-defaults: &httpDefaults
  connect-timeout: 3s
  read-timeout: 10s
  retries: 3
jobs:
  - name: sync-users
    cron: "0 */5 * * * *"
    http: *httpDefaults
  - name: refresh-reports
    cron: "0 0 * * * *"
    http: *httpDefaults

# 多行文本：| 保留换行，>- 将相邻文本行折叠为空格并去掉末尾换行。
templates:
  notification: |
    你好，配置已更新。
    请检查应用状态与监控指标。
  description: >-
    这是一段较长的说明，
    用于检查多行字符串的高亮与折叠效果。
  sql: |
    SELECT id, display_name
    FROM demo_users
    WHERE enabled = true
    ORDER BY id DESC;

# 标量与容器：演示整数、小数、科学计数、不同进制、空值和引号。
yaml-examples:
  integer: 42
  negative: -17
  decimal: 3.14159
  scientific: 6.02e+23
  hexadecimal: 0xFF
  octal: 0o755
  infinity: .inf
  not-a-number: .nan
  boolean: true
  null-value: null
  tilde-null: ~
  empty-value:
  empty-string: ""
  numeric-string: "00123"
  boolean-string: 'false'
  explicit-string: !!str 123
  quoted-text: 'It''s a YAML string: # stays text'
  escaped-text: "first line\\nsecond line\\t\\"quoted\\""
  unicode: "中文、emoji 🌈、符号 ©"
  empty-list: []
  empty-map: {}
  inline-map: { region: cn-east, weight: 0.8, enabled: true }
  mixed-list: [hello, 42, true, null]
  "key with spaces": "带空格的键名"
`;
}

export function createMockApplicationEnvironments(
  systemName: string,
  appName: string,
): ApplicationEnvironment[] {
  return [
    { envTag: 'uat', envOrder: 30, envDesc: '验收测试' },
    { envTag: 'dev', envOrder: 10, envDesc: '开发环境' },
    { envTag: 'prd', envOrder: 50, envDesc: '生产环境' },
    { envTag: 'st', envOrder: 20, envDesc: '系统测试' },
    { envTag: 'stp', envOrder: 40, envDesc: '预生产环境' },
  ].map((env) => ({
    ...env,
    systemName,
    appName,
    isPrd: env.envTag === 'prd' ? '1' : '0',
    approvalRequiredFlag: env.envTag === 'st' ? 'Y' : 'N',
    configInfo: env.envTag === 'st' ? ' ' : createExampleYaml(systemName, appName, env.envTag),
    saveStatus: 'Y',
    unsavedReason: '',
    techCrtTime: '2022-05-09T03:05:07.000+00:00',
    techMntTime: '2026-02-03T01:57:05.000+00:00',
    techVersion: 18,
    maintDate: '2026-02-03',
    maintUser: '谢伟业/80310798',
    currentVersion: 5,
    latestVersion: 12,
    latestShotMessage: '[谢伟业/80310798]2026-02-03：cs',
    currentShotMessage: '[吴图威/AAFNTD]2023-04-11：批量快照',
    enablePublish: 'Y',
    runtimeDifferNum: env.envTag === 'st' ? -2 : 3,
    risk: '1',
    gtwDifferFlag: '0',
  }));
}
