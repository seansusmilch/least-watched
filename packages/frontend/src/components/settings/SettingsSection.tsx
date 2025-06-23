interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <div className='bg-gray-700 rounded-lg overflow-hidden'>
      <div className='px-6 py-4 border-b border-gray-600'>
        <h3 className='text-xl font-semibold text-white'>{title}</h3>
        <p className='text-sm text-gray-300 mt-1'>{description}</p>
      </div>
      <div className='px-6 py-6 space-y-4'>{children}</div>
    </div>
  );
}
