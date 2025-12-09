import React from 'react';
import { Mic } from 'lucide-react';

export const SimpleMarkdown = ({ text }: { text: string }) => {
    const parse = (input: string) => {
        const lines = input.split('\n');
        return lines.map((line, i) => {
            // Handle Media Types (Images/Audio)
            const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
            if (imgMatch) {
                return (
                    <div key={i} className="my-2 rounded-lg overflow-hidden border border-slate-700 bg-black/20">
                        <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full h-auto object-contain" />
                    </div>
                );
            }

            const audioMatch = line.match(/<audio controls src="(.*?)"><\/audio>/);
            if (audioMatch) {
                return (
                    <div key={i} className="my-2 p-2 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-2">
                        <div className="p-2 bg-nova-primary/10 rounded-full text-nova-primary">
                            <Mic size={16} />
                        </div>
                        <audio controls src={audioMatch[1]} className="h-8 w-full max-w-[200px]" />
                    </div>
                );
            }

            let content: React.ReactNode = line;
            let type = 'p';
            let style: any = {};

            if (line.startsWith('# ')) { type = 'h1'; content = line.substring(2); }
            else if (line.startsWith('## ')) { type = 'h2'; content = line.substring(3); }
            else if (line.startsWith('### ')) { type = 'h3'; content = line.substring(4); }
            else if (line.startsWith('- ')) { type = 'li'; content = line.substring(2); }
            else if (line.startsWith('[ ] ')) { type = 'li'; content = <><input type="checkbox" readOnly className="mr-2"/>{line.substring(4)}</>; style = {listStyle: 'none', marginLeft: 0}; }
            else if (line.startsWith('> ')) { type = 'blockquote'; content = line.substring(2); }
            
            if (line.startsWith('<div align="center">')) { 
                style.textAlign = 'center'; 
                content = line.replace('<div align="center">', '').replace('</div>', ''); 
            }
            else if (line.startsWith('<div align="right">')) { 
                style.textAlign = 'right'; 
                content = line.replace('<div align="right">', '').replace('</div>', ''); 
            }
            else if (line.startsWith('<div align="left">')) { 
                style.textAlign = 'left'; 
                content = line.replace('<div align="left">', '').replace('</div>', ''); 
            }

            if (typeof content === 'string') {
                const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|<u>.*?<\/u>)/g);
                content = parts.map((part, idx) => {
                    if (part.startsWith('**') && part.endsWith('**')) return <strong key={idx}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith('*') && part.endsWith('*')) return <em key={idx}>{part.slice(1, -1)}</em>;
                    if (part.startsWith('`') && part.endsWith('`')) return <code key={idx}>{part.slice(1, -1)}</code>;
                    if (part.startsWith('<u>') && part.endsWith('</u>')) return <u key={idx}>{part.slice(3, -4)}</u>;
                    return part;
                });
            }

            if (type === 'li') return <ul key={i}><li style={style}>{content}</li></ul>;
            return React.createElement(type, { key: i, style }, content);
        });
    };

    return <div className="md-content w-full">{parse(text)}</div>;
};