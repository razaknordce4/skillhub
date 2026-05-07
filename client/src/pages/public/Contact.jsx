import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Phone, MapPin, Send,
  MessageSquare, HelpCircle,
} from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic for form submission would go here
    console.log('Form submitted:', formData);
    alert('Thank you for reaching out! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 12 } }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-200 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 flex items-center bg-slate-50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-400/10 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-blue-100/50 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-1.5 mb-6">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700 tracking-wide uppercase">Get in Touch</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-8">
              Let's build the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                next generation
              </span>
              <br /> of talent.
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl text-gray-600 leading-relaxed">
              Have questions about SkillBridge? Our team is ready to support your institution's journey
              towards excellence. Reach out to us anytime.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 2. CONTACT CONTENT */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-16">

            {/* Left: Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-12"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center lg:text-left">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    {
                      icon: <Mail className="w-6 h-6" />,
                      title: "Email Us",
                      content: "razakabdul1144@gmail.com",
                      link: "mailto:razakabdul1144@gmail.com",
                      color: "blue"
                    },
                    {
                      icon: <Phone className="w-6 h-6" />,
                      title: "Call Us",
                      content: "+91 9347623445",
                      link: "tel:9347623445",
                      color: "indigo"
                    },
                    {
                      icon: <MapPin className="w-6 h-6" />,
                      title: "Our Office",
                      content: "Kanuru, Vijayawada, Andhra Pradesh, India",
                      link: "#",
                      color: "purple"
                    }
                  ].map((item, i) => (
                    <motion.a
                      key={i}
                      href={item.link}
                      whileHover={{ x: 10 }}
                      className="flex items-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{item.title}</h4>
                        <p className="text-lg font-bold text-gray-900">{item.content}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              {/* <div>
                <h4 className="text-xl font-bold text-gray-900 mb-6">Follow Our Journey</h4>
                <div className="flex space-x-4">
                  {[Linkedin, Twitter, Instagram, Globe].map((Icon, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      whileHover={{ y: -5, scale: 1.1 }}
                      className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div> */}
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7"
            >
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <h3 className="text-3xl font-bold text-gray-900 mb-8">Send us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="How can we help you?"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Message</label>
                    <textarea
                      rows="5"
                      required
                      placeholder="Tell us more about your requirements..."
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Send Message</span>
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. FAQ SECTION */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-6">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Quick answers to common inquiries.</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "How do I register my institution?", a: "You can reach out to our team via the contact form, and we will guide you through the onboarding process for your entire campus." },
              { q: "Is there a limit to the number of students?", a: "SkillBridge is designed to scale. Whether you have 100 or 10,000 students, our platform handles it seamlessly." },
              { q: "How does the automated attendance work?", a: "Attendance is automatically marked when students join a session through the integrated virtual links on their dashboard." }
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
              >
                <h4 className="text-xl font-bold text-gray-900 mb-3">{faq.q}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FINAL MAP SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-[500px] rounded-[3rem] overflow-hidden bg-gray-100 border border-gray-200 shadow-2xl">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7651.681205760461!2d80.6820890328758!3d16.48360689115864!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35fb19131e1851%3A0x562c7bbacfd6dcb0!2sNagarjuna%20Hospital!5e0!3m2!1sen!2sin!4v1778163769581!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="SkillBridge Office Location"
              className="grayscale hover:grayscale-0 transition-all duration-700"
            ></iframe>
            
            <div className="absolute top-8 left-8 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white max-w-xs"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Visit Our Office</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Near Nagarjuna Hospital, Kanuru, Vijayawada, Andhra Pradesh, India.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
