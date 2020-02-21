// Use GLSL highlighting

let render_vertex = `

  varying vec2 texcoord;

  void main() 
  {
    texcoord = uv;

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
  }

`;

let render_fragment = `

  uniform sampler2D reaction_diffusion;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 light_pos;

  uniform vec3 substance_color;
  uniform vec3 background_color;

  uniform float shininess;

  // Defines the finite differences step size.
  // smaller values => larger gradient => more bump
  const float step = 0.05;

  varying vec2 texcoord;

  float height(float x_offset, float y_offset)
  {
    return texture2D(reaction_diffusion, texcoord + vec2(x_offset, y_offset) / resolution).g;
  }

  vec3 normal()
  {
    float
                            h10 = height(0.0, 1.0),
    h01 = height(-1.0, 0.0),                       h21 = height(1.0, 0.0),
                            h12 = height(0.0,-1.0);

    return cross(normalize(vec3(step, 0.0, h21 - h01)),
                 normalize(vec3(0.0, step, h10 - h12)));
  }

  void main() 
  {
    vec3 normal = normal();

    vec3 texel_pos = vec3(texcoord * resolution, 0.0);
    vec3 light_dir = normalize(light_pos - texel_pos);

    vec3 view_dir = vec3(0.0,0.0,-1.0);
    vec3 reflect_dir = reflect(light_dir, normal);

    vec3 light_color = vec3(1.0);
    vec3 diffuse_color = background_color;

    float h = height(0.0, 0.0);

    float edge0 = 0.150;
    float edge1 = 0.190;

    vec3 specular_color = vec3(0.5,0.5,0.5);
    vec3 specular = vec3(0.0,0.0,0.0);
    
    if(h > edge0)
    {
      vec3 specular1 = light_color * pow(max(dot(view_dir, reflect_dir), 0.0), shininess) * specular_color;
      if(h < edge1)
      {
        diffuse_color = mix(diffuse_color, substance_color, smoothstep(edge0, edge1, h));
        specular = mix(specular, specular1, smoothstep(edge0, edge1, h));
      }
      else
      {
        diffuse_color = substance_color;
        specular = specular1;
      }
    }
    

    vec3 ambient = light_color * 0.1;
    vec3 diffuse = light_color * max(dot(normal, light_dir), 0.0) * diffuse_color;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
  }

`;