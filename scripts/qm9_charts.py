"""Redraw QM9 result charts. Values digitized from supplied plots are approximate."""
import os
os.environ.setdefault('MPLCONFIGDIR', '/tmp/qm9-matplotlib')
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'qm9'
OUT.mkdir(parents=True, exist_ok=True)
BG, FG, GRID = '#0c1711', '#d5e4da', '#294234'
GREEN, CYAN, MUTED = '#5bf293', '#67d8e8', '#819589'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11,
 'figure.facecolor': BG, 'axes.facecolor': BG, 'text.color': FG,
 'axes.labelcolor': FG, 'xtick.color': FG, 'ytick.color': FG,
 'axes.edgecolor': GRID, 'svg.fonttype': 'none'})

def finish(fig, ax, name):
 ax.set_axisbelow(True)
 ax.grid(axis='x', color=GRID, linewidth=.7)
 for s in ax.spines.values(): s.set_visible(False)
 ax.tick_params(length=0, pad=8)
 fig.tight_layout(pad=2)
 fig.savefig(OUT / f'{name}.svg', facecolor=BG)
 plt.close(fig)

def bars(name, labels, values, colors, xmax, xlabel='Mean absolute error · lower is better', approximate=True):
 fig, ax = plt.subplots(figsize=(8, 4.4))
 y=np.arange(len(labels))
 ax.barh(y, values, color=colors, height=.48)
 ax.set_yticks(y,labels); ax.invert_yaxis(); ax.set_xlim(0,xmax)
 ax.set_xlabel(xlabel, labelpad=16)
 for i,v in enumerate(values):
  ax.text(v+xmax*.025,i,('≈ ' if approximate else '')+f'{v:.3f}',va='center',color=FG)
 finish(fig,ax,name)

bars('dipole', ['GAT', 'GATv2', 'Tower GATv2'], [.495,.505,.425], [CYAN,MUTED,GREEN], .64)
bars('zpve', ['GAT', 'GATv2', 'Tower GATv2'], [.185,.795,.148], [CYAN,MUTED,GREEN], 1.02)
bars('ablation', ['All features', 'Atomic number', 'Aromaticity', 'Position'], [.414,.393,.409,.459], [CYAN,MUTED,MUTED,MUTED], .59, 'Test MAE · lower is better')
bars('ggnn', ['GGNN · no edge', 'GGNN · with edge', 'Paper reference'], [3.699,3.766,3.470], [CYAN,MUTED,GREEN], 4.8, 'MAE / chemical accuracy · lower is better', False)

# Approximate heights read from the original comparison; no raw measurements supplied.
labels=['μ','α','HOMO','LUMO','Gap','R²','ZPVE','U₀','U','H','G','Cᵥ','ω']
gat=[.445,.380,.310,.175,.225,.405,.160,.205,.240,.240,.225,.330,.255]
reference=[.550,1.600,1.505,1.475,2.340,.225,1.790,.690,.690,.645,.620,1.250,.255]
fig,ax=plt.subplots(figsize=(8,7))
y=np.arange(len(labels))
ax.barh(y-.17,gat,height=.29,color=CYAN,label='GAT')
ax.barh(y+.17,reference,height=.29,color=MUTED,label='Set2Set + edge reference')
ax.set_yticks(y,labels); ax.invert_yaxis(); ax.set_xlim(0,2.65)
ax.set_xlabel('Reported MAE · compare within each target',labelpad=16)
ax.legend(loc='lower right',facecolor=BG,edgecolor=GRID,labelcolor=FG)
finish(fig,ax,'targets')
