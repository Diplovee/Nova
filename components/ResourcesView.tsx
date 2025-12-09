
import React, { useState } from 'react';
import { Plus, Trash2, Mail } from 'lucide-react';
import { Resource } from '../types';

const MOCK_RESOURCES: Resource[] = [
  { id: '1', name: 'Alex Morgan', role: 'Product Owner', email: 'alex@nova.app', status: 'active', initials: 'AM' },
  { id: '2', name: 'Sarah Chen', role: 'Lead Developer', email: 'sarah@nova.app', status: 'busy', initials: 'SC' },
  { id: '3', name: 'Mike Ross', role: 'UI/UX Designer', email: 'mike@nova.app', status: 'offline', initials: 'MR' },
  { id: '4', name: 'James Wilson', role: 'Frontend Engineer', email: 'james@nova.app', status: 'active', initials: 'JW' },
  { id: '5', name: 'Linda Kim', role: 'QA Lead', email: 'linda@nova.app', status: 'active', initials: 'LK' },
  { id: '6', name: 'Tom Baker', role: 'DevOps', email: 'tom@nova.app', status: 'offline', initials: 'TB' },
  { id: '7', name: 'Emily Davis', role: 'Marketing', email: 'emily@nova.app', status: 'busy', initials: 'ED' },
];

export const ResourcesView: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);

  const addResource = () => {
    const names = ['Emma Davis', 'Lucas Miller', 'Olivia Taylor', 'Noah Anderson', 'Mia Thomas'];
    const roles = ['Backend Dev', 'QA Engineer', 'DevOps', 'Product Designer', 'Marketing Lead'];
    const i = Math.floor(Math.random() * names.length);
    const j = Math.floor(Math.random() * roles.length);
    const name = names[i];
    const role = roles[j];
    const initials = name.split(' ').map(n => n[0]).join('');
    
    const newResource: Resource = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      email: `${name.toLowerCase().replace(' ', '.')}@nova.app`,
      status: 'active',
      initials
    };
    setResources([...resources, newResource]);
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  return (
    <div className="p-10 h-full overflow-y-auto animate-in fade-in duration-500">
       <div className="max-w-6xl mx-auto">
         <div className="flex items-center justify-between mb-10">
            <div>
               <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Team & Resources</h1>
               <p className="text-slate-400">Manage your team members and assign roles.</p>
            </div>
            <button 
                onClick={addResource}
                className="flex items-center gap-2 px-6 py-3 bg-nova-primary hover:bg-cyan-300 text-black font-bold rounded-xl transition-all shadow-glow hover:scale-105 active:scale-95"
            >
                <Plus size={20} /> Add Member
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resources.map(resource => (
              <div key={resource.id} className="bg-nova-card border border-slate-700 hover:border-nova-primary/50 rounded-2xl p-6 group transition-all hover:shadow-float relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nova-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-nova-primary font-bold text-xl border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-300 select-none">
                        {resource.initials}
                    </div>
                    <button 
                        onClick={() => deleteResource(resource.id)} 
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                        title="Remove Member"
                    >
                        <Trash2 size={18} />
                    </button>
                 </div>
                 
                 <div className="mb-4">
                     <h3 className="text-xl font-bold text-white mb-1 group-hover:text-nova-primary transition-colors">{resource.name}</h3>
                     <p className="text-slate-400 text-sm font-medium">{resource.role}</p>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-700/50 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Mail size={14} className="text-slate-500" /> 
                        <span className="truncate">{resource.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                            resource.status === 'active' ? 'bg-green-500 text-green-500' : 
                            resource.status === 'busy' ? 'bg-red-500 text-red-500' : 'bg-slate-500 text-slate-500'
                        }`} />
                        <span className="text-slate-400 capitalize">{resource.status}</span>
                    </div>
                 </div>
              </div>
            ))}
            
            {/* Add New Card Button */}
             <button 
                 onClick={addResource}
                 className="group flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-6 hover:border-nova-primary/30 hover:bg-slate-800/30 transition-all h-full min-h-[240px]"
             >
                 <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-nova-primary group-hover:scale-110 transition-all mb-4 border border-slate-700">
                     <Plus size={24} />
                 </div>
                 <span className="font-medium text-slate-500 group-hover:text-slate-300">Add New Member</span>
             </button>
         </div>
       </div>
    </div>
  );
};
