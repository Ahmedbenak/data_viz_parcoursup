import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import { ArrowLeft, LayoutDashboard, BarChart3, PieChart as PieIcon, LineChart as LineIcon, Activity } from 'lucide-react';

interface SandboxProps {
  onBack: () => void;
  genData: any[];
  proData: any[];
}

const COLORS = ['#e30613', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Sandbox({ onBack, genData: initialGenData, proData: initialProData }: SandboxProps) {
  const [genData, setGenData] = React.useState(initialGenData);
  const [proData, setProData] = React.useState(initialProData);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch sample data if props are empty
  React.useEffect(() => {
    const fetchSampleData = async () => {
      if (initialGenData.length > 0 && initialProData.length > 0) return;
      
      setIsLoading(true);
      try {
        const { getSupabase } = await import('../lib/supabase');
        const supabase = getSupabase();

        // Fetch sample from parcoursup_1 (Bac Général)
        if (initialGenData.length === 0) {
          const { data: gData } = await supabase
            .from('parcoursup_1')
            .select('*')
            .limit(100);
          if (gData) setGenData(gData);
        }

        // Fetch sample from parcoursup_2 (Bac Pro / Map)
        if (initialProData.length === 0) {
          const { data: pData } = await supabase
            .from('parcoursup_2')
            .select('*')
            .limit(100);
          if (pData) setProData(pData);
        }
      } catch (err) {
        console.error("Error fetching sandbox data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSampleData();
  }, [initialGenData, initialProData]);

  // Process Bac Général Data: Top 5 formations by candidates
  const topGenFormations = React.useMemo(() => {
    if (!genData || genData.length === 0) return [];
    const grouped = genData.reduce((acc: any, curr) => {
      const name = curr.formation || "Inconnu";
      acc[name] = (acc[name] || 0) + (Number(curr.candidats_voeu_confirme) || 0);
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [genData]);

  // Process Bac Pro Data: Distribution by Region
  const proByRegion = React.useMemo(() => {
    const grouped = proData.reduce((acc: any, curr) => {
      acc[curr.region] = (acc[curr.region] || 0) + (curr.eff_admis || 0);
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [proData]);

  // Process Bac Pro Data: Selectivity distribution
  const proSelectivity = React.useMemo(() => {
    const grouped = proData.reduce((acc: any, curr) => {
      const label = curr.selectivite || "Non spécifié";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value: value as number }));
  }, [proData]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-16">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-8">
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: '#fff' }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-4 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 shadow-sm"
            >
              <ArrowLeft className="w-7 h-7 text-slate-600" />
            </motion.button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Bac à Sable</h1>
              <p className="text-slate-500 font-medium text-lg mt-1">Visualisations basées sur tes données réelles</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Données Connectées
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mb-6"></div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Chargement de la base...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Section Bac Général */}
            <section className="space-y-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analyse Bac Général</h2>
              </div>

              <div className="grid grid-cols-1 gap-10">
                {/* Top Formations Bar Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft"
                >
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Top 5 Formations (Candidats)</h3>
                  <div className="h-[350px]">
                    {topGenFormations.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topGenFormations} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={150} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }} 
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: 'var(--shadow-soft)', padding: '16px' }}
                          />
                          <Bar dataKey="value" fill="#e30613" radius={[0, 8, 8, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest italic">Aucune donnée</div>
                    )}
                  </div>
                </motion.div>

                {/* Radar Chart for Selectivity */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft"
                >
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Répartition par Sélectivité</h3>
                  <div className="h-[350px]">
                    {proSelectivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={proSelectivity}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }} />
                          <PolarRadiusAxis angle={30} />
                          <Radar
                            name="Nombre d'établissements"
                            dataKey="value"
                            stroke="#e30613"
                            fill="#e30613"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest italic">Aucune donnée</div>
                    )}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Section Bac Pro */}
            <section className="space-y-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <Activity className="w-7 h-7 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analyse Bac Pro</h2>
              </div>

              <div className="grid grid-cols-1 gap-10">
                {/* Region Distribution Pie Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft"
                >
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Admis par Région (Top 6)</h3>
                  <div className="h-[350px]">
                    {proByRegion.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={proByRegion}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {proByRegion.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: 'var(--shadow-soft)', padding: '16px' }}
                          />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest italic">Aucune donnée</div>
                    )}
                  </div>
                </motion.div>

                {/* Admissions vs Capacity Area Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-soft"
                >
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Capacité vs Admis (Echantillon)</h3>
                  <div className="h-[350px]">
                    {proData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={proData.slice(0, 10)}>
                          <defs>
                            <linearGradient id="colorAdmis" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="etablissement" hide />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: 'var(--shadow-soft)', padding: '16px' }}
                          />
                          <Area type="monotone" dataKey="eff_admis" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAdmis)" />
                          <Area type="monotone" dataKey="capacite" stroke="#94a3b8" strokeWidth={2} fill="transparent" strokeDasharray="8 8" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest italic">Aucune donnée</div>
                    )}
                  </div>
                </motion.div>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-32 p-12 bg-slate-900 rounded-[4rem] text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Note de développement</p>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            Cette page est un bac à sable indépendant. Vous pouvez copier les composants de visualisation (Radar, Area, Bar, Pie) 
            et les adapter dans vos pages réelles avec vos propres données.
          </p>
        </footer>
      </div>
    </div>
  );
}
