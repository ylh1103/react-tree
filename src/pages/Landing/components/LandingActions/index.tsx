import { Button } from 'antd';
import { useLinkClickHandler } from 'react-router';

const integrationGuideUrl = 'https://doc.cmbchina.com/f/v?id=MkvTb';

const buttonClass =
  'h-46px! rounded-13px! text-15px! font-500! tracking-[-0.01em]! shadow-none! transition-[background,color,transform]! active:scale-97 motion-reduce:transform-none [@media(max-width:768px)]:h-44px! [@media(max-width:768px)]:text-14px! [@media(max-width:768px)]:px-3!';

export default function LandingActions({
  className = 'flex-wrap [@media(max-width:768px)]:grid [@media(max-width:768px)]:grid-cols-2 [@media(max-width:768px)]:w-full [@media(max-width:359px)]:grid-cols-1',
}: {
  className?: string;
}) {
  const openConsole = useLinkClickHandler<HTMLElement>('/');
  return (
    <div className={`flex gap-2.5 ${className}`}>
      <Button
        type="primary"
        href="/"
        onClick={openConsole}
        icon={<span aria-hidden="true" className="i-lucide-arrow-right h-17px w-17px" />}
        iconPlacement="end"
        className={`${buttonClass} gap-2! pl-21px! pr-17px!`}
      >
        进入控制台
      </Button>
      <Button
        href={integrationGuideUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} px-5!`}
      >
        查看接入指南
      </Button>
    </div>
  );
}
