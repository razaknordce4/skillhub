import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Target, Award, Zap, Users, BarChart3,
  ShieldCheck, ArrowRight, GraduationCap,
  Globe, Heart, Sparkles
} from 'lucide-react';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 12 } }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-200 overflow-hidden">
      {/* 1. HERO SECTION */}
      {/* <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex items-center bg-slate-50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-400/10 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-blue-100/50 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700 tracking-wide uppercase">Our Story</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-8">
              Redefining the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Future of Skilling
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-10">
              SkillBridge is more than just a platform; it's a bridge between ambition and achievement, 
              connecting talent with opportunity through precision and transparency.
            </motion.p>
          </motion.div>
        </div>
      </section> */}

      {/* 2. VISION & MISSION */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[2.5rem] rotate-3 scale-105 -z-10"></div>
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Team working together"
                className="rounded-[2rem] shadow-2xl object-cover h-[500px] w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4">Our Purpose</h2>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Empowering the Skilling Ecosystem</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Founded with a vision to eliminate the friction in state-level skilling programmes,
                SkillBridge provides a unified ecosystem where data drives decisions and transparency fosters trust.
              </p>

              <div className="space-y-6">
                {[
                  { icon: <Target className="text-blue-600" />, title: "Precision Tracking", desc: "Every session, every student, every second accounted for with real-time sync." },
                  { icon: <Globe className="text-indigo-600" />, title: "State-Wide Impact", desc: "Designed to scale across thousands of institutions without compromising on performance." }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUES GRID */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-4">Our Values</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6">The pillars of our platform</h3>
            <p className="text-xl text-gray-400">Built on the foundation of integrity, innovation, and impact.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                title: "Transparency",
                desc: "No more black boxes. Every piece of data is accessible to the stakeholders who need it, when they need it."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Efficiency",
                desc: "Automated workflows and smart attendance systems mean trainers spend more time teaching and less time tracking."
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Student-Centric",
                desc: "Every feature is designed to enhance the student's journey, making learning accessible and records permanent."
              }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/5 backdrop-blur-lg p-10 rounded-[2.5rem] border border-white/10 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h4 className="text-2xl font-bold mb-4">{value.title}</h4>
                <p className="text-gray-400 leading-relaxed text-lg">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ECOSYSTEM BENEFITS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">A Win-Win for Everyone</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                role: "Institutions",
                benefits: ["Real-time Analytics", "Seamless Reporting", "Multiple Batch Management"],
                icon: <BarChart3 className="text-blue-600" />
              },
              {
                role: "Trainers",
                benefits: ["Automated Attendance", "Smart Scheduling", "Student Progress Insight"],
                icon: <Users className="text-indigo-600" />
              },
              {
                role: "Students",
                benefits: ["Easy Join Links", "Verified Attendance", "Session History"],
                icon: <Award className="text-purple-600" />
              }
            ].map((box, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                  {box.icon}
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-6">For {box.role}</h4>
                <ul className="space-y-4">
                  {box.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-center text-gray-600 font-medium">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(37,99,235,0.3)]"
          >
            {/* Animated background elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-24 -right-24 w-64 h-64 border-2 border-white/10 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-24 -left-24 w-80 h-80 border-2 border-white/10 rounded-full"
            />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to start your journey?</h2>
              <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join the SkillBridge ecosystem today and experience the future of professional development.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  to="/register"
                  className="inline-flex justify-center items-center px-10 py-5 text-lg font-bold text-gray-900 bg-white rounded-2xl hover:bg-gray-50 hover:scale-105 transition-all shadow-lg"
                >
                  <GraduationCap className="mr-2 w-6 h-6" /> Join as a Student
                </Link>
                <Link
                  to="/login"
                  className="inline-flex justify-center items-center px-10 py-5 text-lg font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 hover:scale-105 transition-all"
                >
                  Access Dashboard <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
