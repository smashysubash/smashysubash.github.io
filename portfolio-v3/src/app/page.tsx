'use client';
import HeroSection from '@/components/Herosection';
import CoolBackground from '@/components/CoolBackground';
import AboutSection from '@/components/AboutSection';
import Experience from '@/components/Experience';
import SkillSection from '@/components/SkillSection';

export default function Home() {
  return (
    <>
      <CoolBackground />
      <div className='overflow-clip'>
        <HeroSection />
        {/* <div className="h-screen w-full">  </div> */}
        <AboutSection />
      </div>
      <Experience />
      <SkillSection />
    </>
  );
}
