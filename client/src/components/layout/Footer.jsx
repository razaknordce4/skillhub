import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import skillBridgeImg from '../../assets/skill_bridge-removebg-preview.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800 relative overflow-hidden mt-auto">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-white p-1 rounded-lg inline-flex">
                <img src={skillBridgeImg} alt="SkillBridge" className="h-8 w-auto object-contain" />
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              The ultimate role-based attendance management and learning platform. 
              Bridging the gap between institutions, trainers, and students with modern analytics.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wider text-sm uppercase">Platform</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/features" className="text-sm hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link to="/register" className="text-sm hover:text-blue-400 transition-colors">For Institutions</Link></li>
              <li><Link to="/register" className="text-sm hover:text-blue-400 transition-colors">For Students</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wider text-sm uppercase">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-sm hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            &copy; {currentYear} SkillBridge. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Designed with</span>
            <span className="text-red-500">♥</span>
            <span>for Education</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
