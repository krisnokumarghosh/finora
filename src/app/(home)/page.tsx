import CallToAction from '@/components/home/CallToAction';
import Features from '@/components/home/Features';
import Hero from '@/components/home/Hero';
import Security from '@/components/home/Security';
import Testimonials from '@/components/home/Testimonials';
import React from 'react';

const HomePage = () => {
  return (
    <div>
      <Hero/>
      <Features/>
      <Security/>
      <Testimonials/>
      <CallToAction/>
    </div>
  );
};

export default HomePage;