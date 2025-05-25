import React from 'react';
import { TypingAnimation } from '../TypingAnimation';
import { motion } from 'framer-motion'; // Add this import

const experiences = [
  {
    company: 'Vlinder Labs Pvt Ltd',
    role: 'Associate Software Engineer',
    period: 'Sep 2024 - Present',
    description: [
      'Played a key role in the development of new features with user-friendly and responsive React components for TRAG, a traceability application.',
      'Supported the migration from the old codebase to a new, more efficient one.',
      'Developed the DIY flow and analytics feature page, significantly improving user interaction and data visualization capabilities.'
    ],
  },
  {
    company: 'Vlinder Labs Pvt Ltd',
    role: 'Software Engineering Intern',
    period: 'JuL 2023 - Aug 2024',
    description: [
      'Played a key role in the development of new features with user-friendly and responsive React components for TRAG, a traceability application.',
      'Supported the migration from the old codebase to a new, more efficient one.',
      'Developed the DIY flow and analytics feature page, significantly improving user interaction and data visualization capabilities.'
    ],
  },
];

const TimelineDot = () => (
  <span className="flex items-center justify-center w-5 h-5 bg-purple-600 rounded-full border-4 border-white shadow-lg" />
);

const Experience = () => {
  return (
    <section className='bg-[#F0F8FF]'>
      <div className="w-full max-w-3xl mx-auto py-8 pt-16 px-4 font-cabin">
      <h2 className="text-[3.5rem] font-bold text-center text-purple-600 mb-12 font-cabin">
        <TypingAnimation startOnView>Experience</TypingAnimation>
      </h2>
      <ol className="relative border-l-4 border-purple-600">
        {experiences.map((exp, idx) => (
            <motion.li
              key={idx}
              className="mb-12 ml-8 group relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
            >
            <div className="absolute -left-11">{<TimelineDot />}</div>
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 border border-gray-200 shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all group-hover:scale-[1.02]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <span className="text-lg font-semibold text-purple-700 font-cabin">{exp.company}</span>
              <span className="text-sm text-gray-500 font-mono">{exp.period}</span>
              </div>
              <div className="mt-2 text-xl font-bold text-gray-900 font-cabin">{exp.role}</div>
              <ul className="mt-2 text-gray-700 list-disc list-inside space-y-1">
              {exp.description.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
              </ul>
            </div>
            </motion.li>
        ))}
      </ol>
      </div>
    </section>
  );
};

export default Experience;