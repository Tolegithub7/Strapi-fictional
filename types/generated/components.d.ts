import type { Schema, Struct } from '@strapi/strapi';

export interface LayoutBanner extends Struct.ComponentSchema {
  collectionName: 'components_layout_banners';
  info: {
    displayName: 'Banner';
  };
  attributes: {
    description: Schema.Attribute.Text;
    isVisible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    link: Schema.Attribute.Component<'shared.link', false>;
  };
}

export interface LayoutFooter extends Struct.ComponentSchema {
  collectionName: 'components_layout_footers';
  info: {
    displayName: 'Footer';
  };
  attributes: {
    logo: Schema.Attribute.Component<'shared.logo-link', false>;
    navItems: Schema.Attribute.Component<'shared.link', true>;
    socialLinks: Schema.Attribute.Component<'shared.logo-link', true>;
    text: Schema.Attribute.Text;
  };
}

export interface LayoutHeader extends Struct.ComponentSchema {
  collectionName: 'components_layout_headers';
  info: {
    displayName: 'header';
  };
  attributes: {
    cta: Schema.Attribute.Component<'shared.link', false>;
    logo: Schema.Attribute.Component<'shared.logo-link', false>;
    navItems: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Link';
  };
  attributes: {
    href: Schema.Attribute.String;
    isButtonLink: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['primary', 'secondary']>;
  };
}

export interface SharedLogoLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_logo_links';
  info: {
    displayName: 'Logo Link';
  };
  attributes: {
    href: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images', true>;
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'layout.banner': LayoutBanner;
      'layout.footer': LayoutFooter;
      'layout.header': LayoutHeader;
      'shared.link': SharedLink;
      'shared.logo-link': SharedLogoLink;
    }
  }
}
