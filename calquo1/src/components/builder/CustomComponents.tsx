/**
 * Custom CALICO Components for Builder.io
 * Register existing CALICO components for use in Builder visual editor
 */

import { Builder } from '@builder.io/react';
import { StockCard } from '../stock/StockCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * Register CALICO's custom components with Builder.io
 * This allows them to be used in the visual editor
 */

// Register StockCard component
Builder.registerComponent(StockCard, {
  name: 'CALICO Stock Card',
  inputs: [
    {
      name: 'stock',
      type: 'object',
      required: true,
      subFields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'price', type: 'string' },
        { name: 'imageUrl', type: 'string' },
        { name: 'inStock', type: 'boolean', defaultValue: true },
      ],
    },
    {
      name: 'onClick',
      type: 'function',
      hideFromUI: true,
    },
    {
      name: 'showEnhancedView',
      type: 'boolean',
      defaultValue: false,
    },
  ],
});

// Register Button component
Builder.registerComponent(Button, {
  name: 'CALICO Button',
  inputs: [
    {
      name: 'children',
      type: 'string',
      defaultValue: 'Click me',
    },
    {
      name: 'variant',
      type: 'string',
      enum: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      defaultValue: 'default',
    },
    {
      name: 'size',
      type: 'string',
      enum: ['default', 'sm', 'lg', 'icon'],
      defaultValue: 'default',
    },
    {
      name: 'onClick',
      type: 'function',
      hideFromUI: true,
    },
  ],
});

// Register Badge component
Builder.registerComponent(Badge, {
  name: 'CALICO Badge',
  inputs: [
    {
      name: 'children',
      type: 'string',
      defaultValue: 'Badge',
    },
    {
      name: 'variant',
      type: 'string',
      enum: ['default', 'secondary', 'destructive', 'outline'],
      defaultValue: 'default',
    },
  ],
});

// Register Card components
Builder.registerComponent(Card, {
  name: 'CALICO Card',
  inputs: [
    {
      name: 'children',
      type: 'blocks',
      defaultValue: [],
    },
    {
      name: 'className',
      type: 'string',
    },
  ],
  canHaveChildren: true,
});

Builder.registerComponent(CardHeader, {
  name: 'CALICO Card Header',
  inputs: [
    {
      name: 'children',
      type: 'blocks',
      defaultValue: [],
    },
  ],
  canHaveChildren: true,
});

Builder.registerComponent(CardTitle, {
  name: 'CALICO Card Title',
  inputs: [
    {
      name: 'children',
      type: 'string',
      defaultValue: 'Card Title',
    },
  ],
});

Builder.registerComponent(CardContent, {
  name: 'CALICO Card Content',
  inputs: [
    {
      name: 'children',
      type: 'blocks',
      defaultValue: [],
    },
  ],
  canHaveChildren: true,
});

/**
 * Register custom sections for CALICO
 */

// Hero Section Template
Builder.registerComponent(
  (props: { title: string; subtitle: string; imageUrl?: string; ctaText?: string }) => (
    <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-purple-900 mb-4">{props.title}</h1>
        <p className="text-xl text-purple-700 mb-8">{props.subtitle}</p>
        {props.ctaText && (
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            {props.ctaText}
          </Button>
        )}
      </div>
    </div>
  ),
  {
    name: 'CALICO Hero Section',
    inputs: [
      { name: 'title', type: 'string', defaultValue: 'Welcome to CALICO' },
      { name: 'subtitle', type: 'string', defaultValue: 'Weaving India Together!' },
      { name: 'imageUrl', type: 'file', allowedFileTypes: ['jpeg', 'png', 'svg'] },
      { name: 'ctaText', type: 'string', defaultValue: 'Get Started' },
    ],
  }
);

// Festival Banner Template
Builder.registerComponent(
  (props: { festivalName: string; message: string; bgColor?: string }) => (
    <div 
      className="py-8 px-4 text-center"
      style={{ backgroundColor: props.bgColor || 'var(--pastel-purple)' }}
    >
      <h2 className="text-2xl font-bold mb-2">{props.festivalName}</h2>
      <p className="text-lg">{props.message}</p>
    </div>
  ),
  {
    name: 'CALICO Festival Banner',
    inputs: [
      { name: 'festivalName', type: 'string', defaultValue: 'Happy Diwali!' },
      { name: 'message', type: 'string', defaultValue: 'Special offers available' },
      { name: 'bgColor', type: 'color', defaultValue: '#faf5ff' },
    ],
  }
);

// Stats Section
Builder.registerComponent(
  (props: { stats: Array<{ label: string; value: string }> }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8">
      {props.stats?.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-3xl font-bold text-purple-600">{stat.value}</div>
          <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  ),
  {
    name: 'CALICO Stats Section',
    inputs: [
      {
        name: 'stats',
        type: 'list',
        defaultValue: [
          { label: 'Products', value: '1000+' },
          { label: 'Suppliers', value: '50+' },
          { label: 'Orders', value: '5000+' },
          { label: 'Cities', value: '100+' },
        ],
        subFields: [
          { name: 'label', type: 'string' },
          { name: 'value', type: 'string' },
        ],
      },
    ],
  }
);

// Export registration function
export const registerBuilderComponents = () => {
  // Components are registered on import
  // Silent log in dev mode only
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.log('Builder.io custom components registered');
    }
  } catch (error) {
    // Silently handle console error
  }
};
