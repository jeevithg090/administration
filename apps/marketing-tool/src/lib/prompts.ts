import type { PostRequestContext } from '../types';

export interface PromptMessages {
  system: string;
  user: string;
}

/**
 * System and user messages asking a text model to write a detailed image
 * generation prompt for the requested post.
 */
export function buildPromptMessages(request: PostRequestContext): PromptMessages {
  const { festival, brandName: universityName, postType, customText, aspectRatio } = request;
  let systemMessage = '';
  let userMessage = '';

  if (postType === 'event' && festival) {
    systemMessage = `You are an expert social media marketing specialist and graphic design prompt engineer. Create detailed, professional image generation prompts specifically for high-converting social media marketing posts for educational institutions. Focus on creating visually striking, culturally authentic, and engagement-driving content that resonates with students, parents, and the broader community.

Your prompts should include:
- Specific visual composition and layout details
- Professional branding elements and typography suggestions
- Cultural authenticity and respect for traditions
- Color psychology for maximum engagement
- Elements that drive social media interaction (likes, shares, comments)
- Modern design trends suitable for ${aspectRatio.description}
- Call-to-action visual elements

Return ONLY the detailed image generation prompt - no explanations.`;

    userMessage = `Create a premium social media marketing image for ${universityName} celebrating ${festival.name}.

🎯 MARKETING OBJECTIVES:
- Drive enrollment interest and brand awareness
- Showcase university's cultural inclusivity and diversity
- Encourage social media engagement and shares
- Build emotional connection with target audience

📊 FESTIVAL CONTEXT:
- Festival: ${festival.name}
- Description: ${festival.description}
- Traditional Colors: ${festival.colors.join(', ')}
- Cultural Elements: ${festival.keywords.join(', ')}
- Category: ${festival.category}

📱 TECHNICAL SPECS:
- Format: ${aspectRatio.width}x${aspectRatio.height} (${aspectRatio.name})
- Platform: ${aspectRatio.description}
- Quality: Professional, high-resolution social media post

🎨 DESIGN REQUIREMENTS:
- Modern, eye-catching layout with premium aesthetic
- Prominent space for university logo (top-right corner)
- Festive greeting text: "Happy ${festival.name}" in elegant typography
- Traditional cultural symbols and decorative elements
- Vibrant festival colors with sophisticated gradients
- Professional university branding integration
- Celebration atmosphere with authentic cultural representation
- Visual hierarchy that guides viewer attention
- Instagram/Facebook optimized engagement elements

💼 BRAND POSITIONING:
- Position ${universityName} as culturally aware and inclusive
- Demonstrate respect for traditions and diversity
- Show modern, forward-thinking educational approach
- Appeal to both domestic and international students

Generate a detailed prompt for creating this high-converting social media marketing post.`;
  } else if (postType === 'advertisement') {
    systemMessage = `You are a senior marketing creative director specializing in educational institution advertising. Create compelling image generation prompts for university advertisements that drive enrollment, build brand authority, and showcase institutional excellence. Focus on creating aspirational, trustworthy, and professionally appealing visuals.

Your prompts should emphasize:
- Professional educational branding and credibility
- Student success and achievement imagery
- Modern campus life and facilities
- Academic excellence and innovation
- Trust-building visual elements
- Call-to-action optimization for enrollment
- Target audience appeal (students, parents, professionals)

Return ONLY the detailed image generation prompt.`;

    userMessage = `Create a high-impact university advertisement for ${universityName}.

🎯 ADVERTISING GOALS:
- Drive enrollment inquiries and applications
- Build brand trust and academic credibility
- Showcase university excellence and opportunities
- Appeal to prospective students and parents

💬 KEY MESSAGE:
"${customText || 'Excellence in Education - Your Future Starts Here'}"

📱 TECHNICAL SPECIFICATIONS:
- Format: ${aspectRatio.width}x${aspectRatio.height} (${aspectRatio.name})
- Platform: ${aspectRatio.description}
- Quality: Premium advertising standard

🎨 VISUAL REQUIREMENTS:
- Professional, authoritative design aesthetic
- Premium university branding with sophisticated color palette
- Modern campus imagery or educational symbols
- Clear, prominent messaging hierarchy
- University logo placement (prominent but tasteful)
- Trust-building visual elements (academic achievements, accreditations)
- Student success imagery (graduation, career achievements)
- Call-to-action visual cues ("Apply Now", "Learn More")
- Professional typography that conveys excellence
- Clean, uncluttered layout optimized for ${aspectRatio.description}

💼 BRAND MESSAGING:
- Position as premier educational institution
- Emphasize academic excellence and career success
- Highlight modern facilities and innovative programs
- Show pathway to successful career outcomes
- Build confidence in educational investment

Create a detailed prompt for this enrollment-driving advertisement.`;
  } else if (postType === 'announcement') {
    systemMessage = `You are a corporate communications specialist for educational institutions. Create professional image generation prompts for university announcements that ensure clear communication, maintain institutional authority, and encourage community engagement.

Focus on:
- Clear, professional communication design
- Institutional credibility and authority
- Information hierarchy and readability
- Community engagement elements
- Brand consistency and recognition
- Announcement urgency and importance

Return ONLY the detailed image generation prompt.`;

    userMessage = `Create a professional university announcement for ${universityName}.

📢 ANNOUNCEMENT CONTENT:
"${customText || 'Important University Update - Stay Informed'}"

🎯 COMMUNICATION OBJECTIVES:
- Ensure clear, effective information delivery
- Maintain professional institutional image
- Encourage community awareness and engagement
- Build trust through transparent communication

📱 FORMAT SPECIFICATIONS:
- Dimensions: ${aspectRatio.width}x${aspectRatio.height} (${aspectRatio.name})
- Platform: ${aspectRatio.description}
- Standard: Professional institutional communication

🎨 DESIGN REQUIREMENTS:
- Clean, professional layout with clear information hierarchy
- Official university branding and color scheme
- Prominent university logo and institutional identity
- Clear, readable typography for important information
- Professional background that conveys authority
- Subtle design elements that enhance credibility
- Visual indicators of official communication
- Contact information or next steps visibility
- Balanced composition optimized for ${aspectRatio.description}
- Accessibility-conscious design elements

💼 INSTITUTIONAL TONE:
- Professional and authoritative
- Clear and direct communication
- Trustworthy and reliable
- Community-focused and inclusive
- Forward-looking and progressive

Generate a detailed prompt for this official university announcement.`;
  }

  return { system: systemMessage, user: userMessage };
}

/** Deterministic prompt used when no text model is available. */
export function buildFallbackPrompt(request: PostRequestContext): string {
  const { festival, brandName, postType, customText, aspectRatio } = request;
  const size = `${aspectRatio.width}x${aspectRatio.height}`;

  if (postType === 'event' && festival) {
    return (
      `Create a vibrant ${aspectRatio.name} social media post for ${brandName} celebrating ${festival.name}. ` +
      `Design features: festive ${festival.colors.slice(0, 3).join(', ')} color scheme, ` +
      `traditional elements including ${festival.keywords.slice(0, 4).join(', ')}, ` +
      'joyful celebration atmosphere, cultural decorations, modern typography, ' +
      'space for university logo in corner, professional layout, high quality design, ' +
      `${size} dimensions, suitable for ${aspectRatio.description}`
    );
  }
  if (postType === 'advertisement') {
    return (
      `Create a professional ${aspectRatio.name} advertisement for ${brandName}. ` +
      `Message: "${customText || 'Excellence in Education'}". ` +
      'Design features: modern blue and orange university colors, clean layout, ' +
      'educational elements, professional typography, inspiring imagery, ' +
      `space for logo, ${size} format`
    );
  }
  return (
    `Create a clean ${aspectRatio.name} announcement post for ${brandName}. ` +
    `Content: "${customText || 'Important University Update'}". ` +
    'Design features: professional university branding, clear typography, ' +
    'informative layout, modern design, space for logo, ' +
    `${size} dimensions`
  );
}
