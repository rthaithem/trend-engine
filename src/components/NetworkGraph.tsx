import React, { useMemo, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { GraphNode, GraphEdge } from '../services/intelligenceService';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, edges }) => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const elements = useMemo(() => [...nodes, ...edges], [nodes, edges]);

  useEffect(() => {
    return () => {
      if (cyRef.current) {
        try {
          // Prevent layout or animations from trying to notify the destroyed instance
          cyRef.current.stop(true, true);
          cyRef.current.elements().stop(true, true);
        } catch (e) {
          console.error('Error stopping cytoscape animations:', e);
        }
      }
    };
  }, []);

  const stylesheet: any[] = useMemo(() => [
    {
      selector: 'node',
      style: {
        'label': '',
        'background-color': '#111111',
        'width': '20px',
        'height': '20px',
        'shape': 'ellipse',
        'border-width': 2,
        'border-color': '#27272a',
      }
    },
    {
      selector: 'node[type="Core_Issue"]',
      style: {
        'border-color': '#00b4d8',
        'background-color': '#00b4d8',
        'border-width': 3,
        'width': '30px',
        'height': '30px',
      }
    },
    {
      selector: 'node[type="Key_Player"]',
      style: {
        'border-color': '#fbbf24',
        'background-color': '#fbbf24',
        'border-width': 2,
      }
    },
    {
      selector: 'node[type="Beneficiary"]',
      style: {
        'border-color': '#39ff14',
        'background-color': '#39ff14',
        'border-width': 2,
      }
    },
    {
      selector: 'node[type="Victim"]',
      style: {
        'border-color': '#ef4444',
        'background-color': '#ef4444',
        'border-width': 2,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#3f3f46',
        'target-arrow-color': '#3f3f46',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'color': '#71717a',
        'text-background-opacity': 1,
        'text-background-color': '#0a0a0b',
        'text-background-padding': 2,
        'text-rotation': 'autorotate',
      }
    }
  ], []);

  const layout = useMemo(() => ({
    name: 'cose',
    animate: false,
    refresh: 20,
    fit: true,
    padding: 30,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 4000,
    idealEdgeLength: 100,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
  }), []);

  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width: '100%', height: '100%' }}
      stylesheet={stylesheet}
      layout={layout as any}
      cy={(cy) => {
        cyRef.current = cy;
        
        cy.on('mouseover', 'node', (e) => {
          if (cy.destroyed()) return;
          e.target.style('border-width', 3);
          e.target.style('border-color', '#fff');
        });
        
        cy.on('mouseout', 'node', (e) => {
          if (cy.destroyed()) return;
          const type = e.target.data('type');
          let borderColor = '#27272a';
          let borderWidth = 2;
          
          if (type === 'Core_Issue') { borderColor = '#00b4d8'; borderWidth = 3; }
          if (type === 'Key_Player') { borderColor = '#fbbf24'; }
          if (type === 'Beneficiary') { borderColor = '#39ff14'; }
          if (type === 'Victim') { borderColor = '#ef4444'; }
          
          e.target.style('border-width', borderWidth);
          e.target.style('border-color', borderColor);
        });

        cy.fit(undefined, 30);
      }}
    />
  );
};

export default NetworkGraph;
