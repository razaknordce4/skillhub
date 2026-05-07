import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle, Calendar, BarChart3, 
  ShieldCheck, ArrowRight, Zap, GraduationCap, Building2, Play
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const dashboardPath = `/dashboard/${user.role.toLowerCase().replace('_', '-')}`;
      navigate(dashboardPath);
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 10 } }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-200">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        {/* Anti-gravity animated background */}
        <div className="absolute inset-0 bg-slate-50 -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-400/20 blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Hero Content */}
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={containerVariants}
              className="text-center lg:text-left"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-full px-4 py-2 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
                <span className="text-sm font-medium text-blue-700">Next-gen Learning Management</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
                Elevate your <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                   institution's
                </span>
                <br className="hidden lg:block"/> performance
              </motion.h1>
              
              <motion.p variants={itemVariants} className="mt-4 text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
                SkillBridge is the definitive platform connecting institutions, trainers, and students with real-time attendance, analytics, and session scheduling.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-gray-900 rounded-2xl hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                  Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/about" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-gray-900 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                  <Play className="mr-2 w-5 h-5" /> See how it works
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Visual (Anti-gravity cards) */}
            <div className="relative hidden lg:block h-[500px]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {/* Floating Card 1: Attendance */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white w-72 z-20"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-green-100 p-3 rounded-2xl">
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Attendance Marked</h3>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "85%" }}
                      transition={{ delay: 1, duration: 1.5 }}
                      className="h-full bg-green-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">85% Weekly Average</p>
                </motion.div>

                {/* Floating Card 2: Analytics */}
                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-20 left-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white w-80 z-10"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Session Activity</h3>
                    <BarChart3 className="text-blue-500 w-5 h-5" />
                  </div>
                  <div className="flex items-end space-x-3 h-24">
                    {[40, 70, 45, 90, 65, 85].map((height, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 1 + i * 0.1, duration: 0.8 }}
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-md"
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Floating Decoration */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-dashed border-blue-200 rounded-full -z-10"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50 rounded-3xl transform rotate-3 scale-105 -z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Students learning" 
                className="rounded-3xl shadow-xl object-cover h-[500px] w-full"
              />
            </div>
            
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Bridging the gap between tracking and learning.</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                SkillBridge wasn't just built to mark attendance. It was designed to provide a cohesive ecosystem where institutions, trainers, and students operate transparently.
              </p>
              <ul className="space-y-4">
                {[
                  { title: "Real-time sync", desc: "Instantly update records across all dashboards." },
                  { title: "Virtual Link Integration", desc: "Automated attendance via session join links." },
                  { title: "Comprehensive Reporting", desc: "Exportable PDF reports for institutions and PMs." }
                ].map((item, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-semibold tracking-wide uppercase mb-2">Platform Features</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Everything you need to manage education</h3>
            <p className="text-xl text-gray-600">Powerful tools designed for scale, built for simplicity.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <ShieldCheck />, title: "Role-Based Access", desc: "Strictly scoped environments for Admins, PMs, MOs, Institutions, Trainers, and Students." },
              { icon: <CheckCircle />, title: "Smart Attendance", desc: "Automated tracking via virtual session links. Mark present seamlessly." },
              { icon: <Building2 />, title: "Batch Management", desc: "Organize students into logical batches and assign dedicated trainers effortlessly." },
              { icon: <BarChart3 />, title: "Analytics Dashboard", desc: "Visual data representation for attendance rates and session completions." },
              { icon: <Calendar />, title: "Session Scheduling", desc: "Conflict-free scheduling system with meeting link integrations." },
              { icon: <Users />, title: "Invite Onboarding", desc: "Frictionless batch joining via secure invite links for students." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(feature.icon, { className: 'w-7 h-7' })}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. STATS SECTION */}
      <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Students", value: "10,000+" },
              { label: "Expert Trainers", value: "500+" },
              { label: "Sessions Hosted", value: "50,000+" },
              { label: "Institutions", value: "120+" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-extrabold mb-2">{stat.value}</div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
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
            className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl"
          >
            {/* Glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to transform your institution?</h2>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join thousands of students and trainers already using SkillBridge to streamline their educational workflows.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/register" className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-gray-900 bg-white rounded-2xl hover:bg-gray-50 hover:scale-105 transition-all shadow-lg">
                  <GraduationCap className="mr-2 w-5 h-5" /> Sign up as Student
                </Link>
                <Link to="/login" className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 hover:scale-105 transition-all">
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
