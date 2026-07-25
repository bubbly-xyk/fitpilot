import { Card, PageTitle } from '../components/ui';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageTitle title="设置" desc="FitPilot 服务配置" />
      <Card>
        <h3 className="font-semibold text-gray-800 mb-2">AI 服务</h3>
        <p className="text-sm text-gray-600">
          AI 服务由管理员在服务端安全配置。浏览器不会保存或发送模型密钥、
          上游地址或模型名称。
        </p>
      </Card>
    </div>
  );
}
