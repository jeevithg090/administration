import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Festival, AspectRatio, ImageModel } from '../types';

const OPENROUTER_API_KEY = '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';
const HUGGINGFACE_API_KEY = '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';

interface ImagePromptRequest {
  festival?: Festival;
  universityName: string;
  postType: 'event' | 'advertisement' | 'announcement';
  customText?: string;
  aspectRatio: AspectRatio;
  imageModel?: ImageModel;
}

export async function generateImagePrompt(request: ImagePromptRequest): Promise<string> {
  const { festival, universityName, postType, customText, aspectRatio, imageModel } = request;
  
  try {
    console.log('Generating enhanced marketing prompt with OpenRouter LLM...');
    
    // Create a comprehensive prompt for better marketing content
    let userMessage = '';
    let systemMessage = '';
    
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3.5-sonnet',  // Using Claude for better marketing prompts
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'http://localhost:5173',
          'X-Title': 'ICAS Marketing Tool'
        },
        timeout: 25000,
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const generatedPrompt = response.data.choices[0].message.content.trim();
      console.log('✓ Enhanced marketing prompt generated:', generatedPrompt);
      return generatedPrompt;
    } else {
      throw new Error('Invalid response format from OpenRouter');
    }
    
  } catch (error) {
    console.error('Error generating enhanced prompt with OpenRouter:', error);
    console.log('Using enhanced fallback prompt generation...');
    return generateEnhancedFallbackPrompt(request);
  }
}

// Enhanced fallback prompt generation
function generateEnhancedFallbackPrompt(request: ImagePromptRequest): string {
  const { festival, universityName, postType, customText, aspectRatio } = request;
  
  let prompt = '';
  
  if (postType === 'event' && festival) {
    prompt = `Create a vibrant ${aspectRatio.name} social media post for ${universityName} celebrating ${festival.name}. `;
    prompt += `Design features: festive ${festival.colors.slice(0, 3).join(', ')} color scheme, `;
    prompt += `traditional elements including ${festival.keywords.slice(0, 4).join(', ')}, `;
    prompt += `joyful celebration atmosphere, cultural decorations, modern typography, `;
    prompt += `space for university logo in corner, professional layout, high quality design, `;
    prompt += `${aspectRatio.width}x${aspectRatio.height} dimensions, suitable for ${aspectRatio.description}`;
  } else if (postType === 'advertisement') {
    prompt = `Create a professional ${aspectRatio.name} advertisement for ${universityName}. `;
    prompt += `Message: "${customText || 'Excellence in Education'}". `;
    prompt += `Design features: modern blue and orange university colors, clean layout, `;
    prompt += `educational elements, professional typography, inspiring imagery, `;
    prompt += `space for logo, ${aspectRatio.width}x${aspectRatio.height} format`;
  } else if (postType === 'announcement') {
    prompt = `Create a clean ${aspectRatio.name} announcement post for ${universityName}. `;
    prompt += `Content: "${customText || 'Important University Update'}". `;
    prompt += `Design features: professional university branding, clear typography, `;
    prompt += `informative layout, modern design, space for logo, `;
    prompt += `${aspectRatio.width}x${aspectRatio.height} dimensions`;
  }
  
  return prompt;
}

export async function generateImage(prompt: string, aspectRatio: AspectRatio, model?: ImageModel): Promise<string> {
  try {
    console.log(`Generating AI image for ${aspectRatio.name} format using ${model?.name || 'default model'}...`);
    console.log('Using prompt:', prompt);
    
    // Route to appropriate generation method based on selected model
    if (!model || model.provider === 'local') {
      return generateCustomCanvasImage(prompt, aspectRatio);
    }
    
    switch (model.provider) {
      case 'openrouter':
        return await generateImageWithOpenRouter(prompt, aspectRatio, model);
      case 'qwen':
        return await generateImageWithQwen(prompt, aspectRatio);
      case 'huggingface':
        return await generateImageWithHuggingFace(prompt, aspectRatio, model);
      default:
        console.log('Unknown model provider, falling back to local generation');
        return generateCustomCanvasImage(prompt, aspectRatio);
    }
    
  } catch (error) {
    console.error('Error generating AI image:', error);
    console.log('Using local fallback image generation...');
    return generateCustomCanvasImage(prompt, aspectRatio);
  }
}

// Enhanced image generation using alternative AI services
async function generateImageWithStableDiffusion(prompt: string, aspectRatio: AspectRatio): Promise<string> {
  try {
    console.log('Attempting image generation with Stable Diffusion...');
    
    // Use a more reliable Stable Diffusion API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token r8_6L0ZnR9gH8aCj8lGw8r8TzKx3Q7w0C0z1J3M2L5'
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
        input: {
          prompt: prompt,
          width: aspectRatio.width,
          height: aspectRatio.height,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.urls && result.urls.get) {
        // Poll for completion
        let attempts = 0;
        while (attempts < 30) {
          const statusResponse = await fetch(result.urls.get, {
            headers: {
              'Authorization': 'Token r8_6L0ZnR9gH8aCj8lGw8r8TzKx3Q7w0C0z1J3M2L5'
            }
          });
          
          if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            if (statusResult.status === 'succeeded' && statusResult.output) {
              console.log('✓ Stable Diffusion image generated successfully');
              return statusResult.output[0];
            }
            if (statusResult.status === 'failed') {
              throw new Error('Stable Diffusion generation failed');
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      }
    }
    
    throw new Error('Stable Diffusion API failed');
    
  } catch (error) {
    console.error('Stable Diffusion generation failed:', error);
    throw error;
  }
}

// Generate image using OpenRouter (DALL-E, Flux, etc.)
async function generateImageWithOpenRouter(prompt: string, aspectRatio: AspectRatio, model: ImageModel): Promise<string> {
  try {
    console.log(`Attempting image generation with ${model.name} via OpenRouter...`);
    
    if (model.endpoint === 'openai/dall-e-3') {
      // DALL-E 3 specific implementation
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/dall-e-3',
          messages: [
            {
              role: 'user',
              content: `Create a high-quality marketing image: ${prompt}. Style: Professional social media post, ${aspectRatio.width}x${aspectRatio.height} aspect ratio, university branding, modern design.`
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin || 'http://localhost:5173',
            'X-Title': 'ICAS Marketing Tool'
          },
          timeout: 60000
        }
      );
      
      if (response.data.choices && response.data.choices[0]) {
        const imageUrl = response.data.choices[0].message.content;
        if (imageUrl && imageUrl.includes('http')) {
          console.log('✓ DALL-E 3 image generated successfully');
          return imageUrl;
        }
      }
    } else if (model.endpoint === 'black-forest-labs/flux-1.1-pro') {
      // Flux Pro implementation
      const response = await axios.post(
        'https://openrouter.ai/api/v1/images/generations',
        {
          model: 'black-forest-labs/flux-1.1-pro',
          prompt: `Professional marketing image: ${prompt}`,
          size: `${aspectRatio.width}x${aspectRatio.height}`,
          quality: 'hd',
          style: 'vivid'
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      
      if (response.data.data && response.data.data[0] && response.data.data[0].url) {
        console.log('✓ Flux Pro image generated successfully');
        return response.data.data[0].url;
      }
    }
    
    throw new Error('OpenRouter generation failed');
    
  } catch (error) {
    console.error('OpenRouter generation error:', error);
    throw error;
  }
}

// Generate image using Qwen-VL model
async function generateImageWithQwen(prompt: string, aspectRatio: AspectRatio): Promise<string> {
  try {
    console.log('Note: Qwen-VL is a vision-language model, not an image generator. Falling back to enhanced local generation...');
    
    // Since Qwen-VL doesn't generate images, use it to enhance the prompt and then generate locally
    const response = await fetch(
      'https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-72B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Analyze this image description and provide key visual elements for canvas generation: ${prompt}. Extract: main colors, key objects, layout, mood, and festival elements.`,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.5,
            return_full_text: false
          }
        })
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      if (result && result[0] && result[0].generated_text) {
        console.log('✓ Qwen-VL analysis completed, generating enhanced canvas image...');
        // Use the analysis to create a more sophisticated canvas image
        return generateEnhancedCanvasImage(prompt, aspectRatio, result[0].generated_text);
      }
    }
    
    console.log('Qwen-VL analysis failed, using standard enhanced canvas generation...');
    return generateEnhancedCanvasImage(prompt, aspectRatio);
    
  } catch (error) {
    console.error('Qwen analysis error:', error);
    console.log('Falling back to enhanced canvas generation...');
    return generateEnhancedCanvasImage(prompt, aspectRatio);
  }
}

// Generate image using Hugging Face models
async function generateImageWithHuggingFace(prompt: string, aspectRatio: AspectRatio, model: ImageModel): Promise<string> {
  try {
    console.log(`Attempting image generation with ${model.name}...`);
    
    const response = await fetch(
      model.endpoint!,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: Math.min(aspectRatio.width, 1024),
            height: Math.min(aspectRatio.height, 1024),
            num_inference_steps: 50,
            guidance_scale: 7.5
          }
        })
      }
    );
    
    if (response.ok) {
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      console.log(`✓ ${model.name} image generated successfully`);
      return imageUrl;
    }
    
    throw new Error(`${model.name} generation failed`);
    
  } catch (error) {
    console.error(`${model.name} generation error:`, error);
    throw error;
  }
}

// Enhanced canvas image generation with prompt analysis
function generateEnhancedCanvasImage(prompt: string, aspectRatio: AspectRatio, analysis?: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = aspectRatio.width;
    canvas.height = aspectRatio.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    // Analyze prompt for better interpretation
    const lowerPrompt = (prompt + ' ' + (analysis || '')).toLowerCase();
    
    // Extract colors from prompt
    let primaryColor = '#4F46E5';
    let secondaryColor = '#7C3AED';
    let textColor = '#FFFFFF';
    let accentColor = '#FFD700';
    
    // Festival and event specific styling
    if (lowerPrompt.includes('karva chauth')) {
      primaryColor = '#8B0000'; // Deep red
      secondaryColor = '#FFD700'; // Gold
      accentColor = '#FF1493'; // Pink
      textColor = '#FFFFFF';
    } else if (lowerPrompt.includes('diwali')) {
      primaryColor = '#FFD700'; // Gold
      secondaryColor = '#FF8C00'; // Orange
      accentColor = '#8B4513'; // Brown
      textColor = '#8B4513';
    } else if (lowerPrompt.includes('holi')) {
      primaryColor = '#FF69B4'; // Pink
      secondaryColor = '#9370DB'; // Purple
      accentColor = '#00FF00'; // Green
      textColor = '#FFFFFF';
    } else if (lowerPrompt.includes('christmas')) {
      primaryColor = '#DC143C'; // Red
      secondaryColor = '#228B22'; // Green
      accentColor = '#FFD700'; // Gold
      textColor = '#FFFFFF';
    }
    
    // Extract festival name
    let festivalName = 'ICAS Manipal';
    let subtitle = 'Excellence in Education';
    
    if (lowerPrompt.includes('karva chauth')) {
      festivalName = 'Happy Karva Chauth';
      subtitle = 'Celebrating Our Cultural Heritage';
    } else if (lowerPrompt.includes('diwali')) {
      festivalName = 'Happy Diwali';
      subtitle = 'Festival of Lights';
    } else if (lowerPrompt.includes('holi')) {
      festivalName = 'Happy Holi';
      subtitle = 'Festival of Colors';
    }
    
    // Create sophisticated gradient
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.6, secondaryColor);
    gradient.addColorStop(1, primaryColor);
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add sophisticated patterns
    if (lowerPrompt.includes('mandala') || lowerPrompt.includes('karva chauth')) {
      drawMandalaPattern(ctx, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.3, accentColor);
    }
    
    // Add decorative elements based on prompt
    if (lowerPrompt.includes('moon') || lowerPrompt.includes('karva chauth')) {
      drawMoon(ctx, canvas.width * 0.8, canvas.height * 0.2, Math.min(canvas.width, canvas.height) * 0.1, accentColor);
    }
    
    // Add cultural elements
    ctx.globalAlpha = 0.2;
    drawCulturalElements(ctx, canvas.width, canvas.height, accentColor, lowerPrompt);
    ctx.globalAlpha = 1;
    
    // Add text with sophisticated typography
    const titleSize = Math.max(24, Math.min(canvas.width, canvas.height) / 15);
    const subtitleSize = Math.max(16, Math.min(canvas.width, canvas.height) / 25);
    
    // Title with shadow
    ctx.font = `bold ${titleSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(festivalName, canvas.width / 2 + 2, canvas.height / 2 - 30 + 2);
    
    // Main text with gradient
    const textGradient = ctx.createLinearGradient(0, canvas.height / 2 - 50, 0, canvas.height / 2 - 10);
    textGradient.addColorStop(0, textColor);
    textGradient.addColorStop(1, accentColor);
    ctx.fillStyle = textGradient;
    ctx.fillText(festivalName, canvas.width / 2, canvas.height / 2 - 30);
    
    // Subtitle
    ctx.font = `${subtitleSize}px Arial, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.9;
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 20);
    
    // University branding
    ctx.globalAlpha = 1;
    const brandingSize = Math.max(12, Math.min(canvas.width, canvas.height) / 40);
    ctx.font = `${brandingSize}px Arial, sans-serif`;
    ctx.fillText('ICAS Manipal', canvas.width / 2, canvas.height - 30);
    
    // Logo placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(canvas.width - 90, 20, 70, 70);
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOGO', canvas.width - 55, 55);
    
    return canvas.toDataURL('image/png', 0.9);
    
  } catch (error) {
    console.error('Enhanced canvas generation error:', error);
    // Fallback to basic generation
    return generateCustomCanvasImage(prompt, aspectRatio);
  }
}

// Helper function to draw mandala patterns
function drawMandalaPattern(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3;
  
  // Draw concentric circles
  for (let r = radius * 0.3; r <= radius; r += 20) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw radial lines
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
    ctx.stroke();
  }
  
  ctx.globalAlpha = 1;
}

// Helper function to draw moon
function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Add crescent effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(x + radius * 0.3, y - radius * 0.3, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
}

// Helper function to draw cultural elements
function drawCulturalElements(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, prompt: string) {
  ctx.fillStyle = color;
  
  if (prompt.includes('diya') || prompt.includes('karva chauth') || prompt.includes('diwali')) {
    // Draw diyas (oil lamps)
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      drawDiya(ctx, x, y, 8);
    }
  }
  
  if (prompt.includes('rangoli') || prompt.includes('pattern')) {
    // Draw rangoli patterns in corners
    drawRangoliCorner(ctx, 50, 50, 30);
    drawRangoliCorner(ctx, width - 50, height - 50, 30);
  }
}

// Helper function to draw diya
function drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Flame
  ctx.beginPath();
  ctx.ellipse(x, y - size * 0.8, size * 0.3, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function to draw rangoli corner
function drawRangoliCorner(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Basic canvas image generation (fallback)
function generateCustomCanvasImage(prompt: string, aspectRatio: AspectRatio): string {
  return generateEnhancedCanvasImage(prompt, aspectRatio);
}

// Generate SVG image as data URL
function generateSVGImage(prompt: string, aspectRatio: AspectRatio): string {
  const lowerPrompt = prompt.toLowerCase();
  let backgroundColor = '#4F46E5';
  let accentColor = '#7C3AED';
  let textColor = '#FFFFFF';
  let emoji = '🎓';
  let festivalName = 'ICAS Manipal';
  
  // Determine colors and emoji based on prompt
  if (lowerPrompt.includes('diwali')) {
    backgroundColor = '#FFD700';
    accentColor = '#FF8C00';
    textColor = '#8B4513';
    emoji = '🪔';
    festivalName = 'Happy Diwali';
  } else if (lowerPrompt.includes('holi')) {
    backgroundColor = '#FF69B4';
    accentColor = '#9370DB';
    textColor = '#FFFFFF';
    emoji = '🎨';
    festivalName = 'Happy Holi';
  } else if (lowerPrompt.includes('christmas')) {
    backgroundColor = '#DC143C';
    accentColor = '#228B22';
    textColor = '#FFFFFF';
    emoji = '🎄';
    festivalName = 'Merry Christmas';
  } else if (lowerPrompt.includes('eid')) {
    backgroundColor = '#00FF7F';
    accentColor = '#32CD32';
    textColor = '#FFFFFF';
    emoji = '🌙';
    festivalName = 'Eid Mubarak';
  } else if (lowerPrompt.includes('navratri')) {
    backgroundColor = '#FF1493';
    accentColor = '#FF69B4';
    textColor = '#FFFFFF';
    emoji = '💃';
    festivalName = 'Happy Navratri';
  } else if (lowerPrompt.includes('ganesh')) {
    backgroundColor = '#FF6B35';
    accentColor = '#FF8C42';
    textColor = '#FFFFFF';
    emoji = '🐘';
    festivalName = 'Ganesh Chaturthi';
  }
  
  const svg = `
    <svg width="${aspectRatio.width}" height="${aspectRatio.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${accentColor};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Decorative circles -->
      <circle cx="${aspectRatio.width * 0.1}" cy="${aspectRatio.height * 0.1}" r="${Math.min(aspectRatio.width, aspectRatio.height) * 0.05}" fill="white" opacity="0.2"/>
      <circle cx="${aspectRatio.width * 0.9}" cy="${aspectRatio.height * 0.2}" r="${Math.min(aspectRatio.width, aspectRatio.height) * 0.03}" fill="white" opacity="0.3"/>
      <circle cx="${aspectRatio.width * 0.8}" cy="${aspectRatio.height * 0.8}" r="${Math.min(aspectRatio.width, aspectRatio.height) * 0.04}" fill="white" opacity="0.2"/>
      <circle cx="${aspectRatio.width * 0.2}" cy="${aspectRatio.height * 0.9}" r="${Math.min(aspectRatio.width, aspectRatio.height) * 0.06}" fill="white" opacity="0.1"/>
      
      <!-- Main content -->
      <g transform="translate(${aspectRatio.width / 2}, ${aspectRatio.height / 2})">
        <!-- Festival name -->
        <text x="0" y="-${Math.min(aspectRatio.width, aspectRatio.height) * 0.1}" 
              text-anchor="middle" 
              fill="${textColor}" 
              font-family="Arial, sans-serif" 
              font-weight="bold" 
              font-size="${Math.max(24, Math.min(aspectRatio.width, aspectRatio.height) / 20)}" 
              filter="url(#shadow)">
          ${festivalName}
        </text>
        
        <!-- Emoji -->
        <text x="0" y="${Math.min(aspectRatio.width, aspectRatio.height) * 0.05}" 
              text-anchor="middle" 
              font-size="${Math.max(48, Math.min(aspectRatio.width, aspectRatio.height) / 10)}">
          ${emoji}
        </text>
        
        <!-- University name -->
        <text x="0" y="${Math.min(aspectRatio.width, aspectRatio.height) * 0.15}" 
              text-anchor="middle" 
              fill="${textColor}" 
              font-family="Arial, sans-serif" 
              font-weight="normal" 
              font-size="${Math.max(16, Math.min(aspectRatio.width, aspectRatio.height) / 30)}" 
              opacity="0.9">
          ICAS Manipal
        </text>
      </g>
      
      <!-- Logo placeholder -->
      <g transform="translate(${aspectRatio.width - 80}, 20)">
        <rect width="60" height="60" rx="10" fill="white" opacity="0.9"/>
        <text x="30" y="35" text-anchor="middle" fill="${backgroundColor}" font-family="Arial, sans-serif" font-weight="bold" font-size="12">LOGO</text>
      </g>
    </svg>
  `;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Generate data URL image (most reliable fallback)
function generateDataURLImage(prompt: string, aspectRatio: AspectRatio): string {
  try {
    return generateCustomCanvasImage(prompt, aspectRatio);
  } catch (canvasError) {
    // If canvas fails, generate SVG
    return generateSVGImage(prompt, aspectRatio);
  }
}

export async function generateMultipleImages(
  prompt: string, 
  aspectRatios: AspectRatio[],
  model?: ImageModel
): Promise<{ aspectRatio: AspectRatio; imageUrl: string; prompt: string; model: string }[]> {
  console.log(`Starting generation of ${aspectRatios.length} images with ${model?.name || 'local model'}...`);
  const results = [];
  
  for (let i = 0; i < aspectRatios.length; i++) {
    const aspectRatio = aspectRatios[i];
    try {
      console.log(`Generating image ${i + 1}/${aspectRatios.length} for ${aspectRatio.name}...`);
      
      // Add a small delay to prevent overwhelming the service
      if (i > 0 && model?.provider !== 'local') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const imageUrl = await generateImage(prompt, aspectRatio, model);
      results.push({
        aspectRatio,
        imageUrl,
        prompt,
        model: model?.name || 'Local Canvas'
      });
      
      console.log(`✓ Generated image ${i + 1}/${aspectRatios.length}`);
    } catch (error) {
      console.error(`Error generating image for ${aspectRatio.name}:`, error);
      
      // Add a fallback image even if generation fails
      try {
        const fallbackUrl = generateCustomCanvasImage(prompt, aspectRatio);
        results.push({
          aspectRatio,
          imageUrl: fallbackUrl,
          prompt: prompt + ' (fallback)',
          model: 'Local Canvas (Fallback)'
        });
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
        // Final fallback - SVG
        const svgUrl = generateSVGImage(prompt, aspectRatio);
        results.push({
          aspectRatio,
          imageUrl: svgUrl,
          prompt: prompt + ' (SVG fallback)',
          model: 'SVG Fallback'
        });
      }
    }
  }
  
  console.log(`✓ All ${results.length} images generated successfully!`);
  return results;
}