'use client';

import { BoxReveal } from '../BoxReveal';
import SpotlightCard from '../SpotlightCard';

export default function AboutSection() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen w-full overflow-x-clip bg-[#F0F8FF] px-2 py-8 overflow-hidden">
      {/* Profile Card: Show first on mobile, second on desktop */}
      <div className="w-full md:basis-1/3 flex-auto md:p-8 lg:p-16 p-0 mb-8 md:mb-0 flex justify-center order-1 md:order-2">
        <SpotlightCard className="bg-white/10 shadow-[0_0_32px_rgba(168,85,247,0.3)] backdrop-blur-[5.5px] rounded-xl border border-white/18 p-8 flex flex-col items-center">
          <div className="avatar w-full flex justify-center">
            <div className="rounded">
              <img src={'profile.jpg'} className="object-cover w-full h-full" />
            </div>
          </div>
          <SocialButtons />
        </SpotlightCard>
      </div>
      {/* About Card: Show second on mobile, first on desktop */}
      <div className="w-full md:basis-2/3 flex-auto lg:p-16 md:p-8 p-0 order-2 md:order-1">
        <SpotlightCard className="p-8 bg-white/10 shadow-[0_0_32px_rgba(168,85,247,0.3)] backdrop-blur-[5.5px] rounded-xl border border-white/18">
          <BoxReveal boxColor={'#800080'} duration={0.5}>
            <p className="text-[2rem] md:text-[3.5rem] font-semibold text-white font-cabin">
              About Me
            </p>
          </BoxReveal>
          <BoxReveal boxColor={'#800080'} duration={0.5}>
            <div className="mt-6 text-base md:text-[1.25rem] text-white font-cabin">
              <p>
                Experienced Full-Stack Web Developer proficient in the MERN stack, with a strong focus on building dynamic, responsive web applications. Skilled in developing reusable components, optimizing performance, and delivering scalable solutions. Passionate about full-stack development, with a strong focus on delivering seamless user experiences and building scalable, maintainable backend systems. Committed to continuous learning and staying current with evolving technologies.
              </p>
            </div>
          </BoxReveal>
        </SpotlightCard>
      </div>
    </div>
  );
}

const SocialButtons = () => {
  return (
    <div className="flex m-6 justify-center-safe">
      {/* LinkedIn Button */}
      <a
        target="_blank"
        href="https://www.linkedin.com/in/subash07/"
        rel="noopener noreferrer"
        className="cursor-pointer relative z-0 flex items-center justify-center w-[50px] h-[50px] rounded-full border-none bg-[#0A66C2] ml-2.5 transition-all duration-100 active:scale-95 hover:before:w-0 hover:before:h-0 before:content-[''] before:absolute before:w-[55px] before:h-[55px] before:bg-[#212121] before:rounded-full before:-z-10 before:border-0 before:transition-all before:duration-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-[30px] h-[30px] text-white z-10"
        >
          <path
            clipRule="evenodd"
            d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"
            fillRule="evenodd"
          />
        </svg>
      </a>
      {/* Email Button */}
      <a
        target="_blank"
        href="mailto:smashysubash@gmail.com"
        rel="noopener noreferrer"
        className="cursor-pointer relative z-0 flex items-center justify-center w-[50px] h-[50px] rounded-full border-none bg-[#EE4B2B] ml-2.5 transition-all duration-100 active:scale-95 hover:before:w-0 hover:before:h-0 before:content-[''] before:absolute before:w-[55px] before:h-[55px] before:bg-[#212121] before:rounded-full before:-z-10 before:border-0 before:transition-all before:duration-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-[30px] h-[30px] text-white z-10"
        >
          <path
            clipRule="evenodd"
            d="M22 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6Zm-2 0-8 5-8-5h16Zm0 12H4V8l8 5 8-5v10Z"
            fillRule="evenodd"
          />
        </svg>
      </a>
      {/* WhatsApp Button */}
      <a
        target="_blank"
        href="https://wa.me/919786358111"
        rel="noopener noreferrer"
        className="cursor-pointer relative z-0 flex items-center justify-center w-[50px] h-[50px] rounded-full border-none bg-[#25D366] ml-2.5 transition-all duration-100 active:scale-95 hover:before:w-0 hover:before:h-0 before:content-[''] before:absolute before:w-[55px] before:h-[55px] before:bg-[#212121] before:rounded-full before:-z-10 before:border-0 before:transition-all before:duration-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-[30px] h-[30px] text-white z-10"
        >
          <path
            clipRule="evenodd"
            d="M12 4a8 8 0 0 0-6.895 12.06l.569.718-.697 2.359 2.32-.648.379.243A8 8 0 1 0 12 4ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-5.016-1.347l-4.948 1.382 1.426-4.829-.006-.007-.033-.055A9.958 9.958 0 0 1 2 12Z"
            fillRule="evenodd"
            fill="currentColor"
          />
          <path
            d="M16.735 13.492c-.038-.018-1.497-.736-1.756-.83a1.008 1.008 0 0 0-.34-.075c-.196 0-.362.098-.49.291-.146.217-.587.732-.723.886-.018.02-.042.045-.057.045-.013 0-.239-.093-.307-.123-1.564-.68-2.751-2.313-2.914-2.589-.023-.04-.024-.057-.024-.057.005-.021.058-.074.085-.101.08-.079.166-.182.249-.283l.117-.14c.121-.14.175-.25.237-.375l.033-.066a.68.68 0 0 0-.02-.64c-.034-.069-.65-1.555-.715-1.711-.158-.377-.366-.552-.655-.552-.027 0 0 0-.112.005-.137.005-.883.104-1.213.311-.35.22-.94.924-.94 2.16 0 1.112.705 2.162 1.008 2.561l.041.06c1.161 1.695 2.608 2.951 4.074 3.537 1.412.564 2.081.63 2.461.63.16 0 .288-.013.4-.024l.072-.007c.488-.043 1.56-.599 1.804-1.276.192-.534.243-1.117.115-1.329-.088-.144-.239-.216-.43-.308Z"
            fill="currentColor"
          />
        </svg>
      </a>
      {/* GitHub Button */}
      <a
        target="_blank"
        href="https://github.com/smashysubash"
        rel="noopener noreferrer"
        className="cursor-pointer relative z-0 flex items-center justify-center w-[50px] h-[50px] rounded-full border-none bg-black ml-2.5 transition-all duration-100 active:scale-95 hover:before:w-0 hover:before:h-0 before:content-[''] before:absolute before:w-[55px] before:h-[55px] before:bg-[#212121] before:rounded-full before:-z-10 before:border-0 before:transition-all before:duration-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-[30px] h-[30px] text-white z-10"
        >
          <path
            clipRule="evenodd"
            d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"
            fillRule="evenodd"
          />
        </svg>
      </a>
    </div>
  );
};
